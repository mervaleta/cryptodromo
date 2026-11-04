<?php
declare(strict_types=1);
/**
 * Shared sandbox wallet helpers. Same SQLite and demo_owners.credits as /api/stables.php.
 * Never use with real money. All callers must hold BEGIN IMMEDIATE for mutations.
 */
const DEMO_MAX = 100000000;
function dw_schema(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS demo_cash (
        owner_id TEXT PRIMARY KEY REFERENCES demo_owners(id), usd_cents INTEGER NOT NULL DEFAULT 0 CHECK(usd_cents>=0),
        held_cents INTEGER NOT NULL DEFAULT 0 CHECK(held_cents>=0))");
    $db->exec("CREATE TABLE IF NOT EXISTS demo_money_ops (
        op_key TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES demo_owners(id), kind TEXT NOT NULL,
        created_at TEXT NOT NULL)");
    $db->exec("CREATE TABLE IF NOT EXISTS demo_money_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT, op_key TEXT NOT NULL REFERENCES demo_money_ops(op_key),
        owner_id TEXT NOT NULL REFERENCES demo_owners(id), currency TEXT NOT NULL, bucket TEXT NOT NULL,
        delta INTEGER NOT NULL, created_at TEXT NOT NULL)");
    $db->exec("CREATE INDEX IF NOT EXISTS ix_demo_money_entries_owner ON demo_money_entries(owner_id,id)");
    $db->exec("CREATE TABLE IF NOT EXISTS demo_money_intents (
        id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES demo_owners(id), kind TEXT NOT NULL,
        method TEXT NOT NULL, usd_cents INTEGER NOT NULL, fee_cents INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL, details TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    $db->exec("CREATE INDEX IF NOT EXISTS ix_demo_money_intents_owner ON demo_money_intents(owner_id,created_at)");
    $db->exec("CREATE TABLE IF NOT EXISTS demo_bet_tickets (
        id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES demo_owners(id),
        absolute_round INTEGER NOT NULL, fixture_version TEXT NOT NULL,
        runner TEXT NOT NULL, market TEXT NOT NULL, stake INTEGER NOT NULL,
        odds_milli INTEGER NOT NULL, payout INTEGER NOT NULL DEFAULT 0,
        result_position INTEGER, status TEXT NOT NULL, created_at TEXT NOT NULL, settled_at TEXT)");
    $db->exec("CREATE INDEX IF NOT EXISTS ix_demo_bets_owner ON demo_bet_tickets(owner_id,created_at)");
    $db->exec("CREATE INDEX IF NOT EXISTS ix_demo_bets_open ON demo_bet_tickets(status,absolute_round)");
}
function dw_owner(PDO $db, string $owner): void {
    $q=$db->prepare('INSERT OR IGNORE INTO demo_cash(owner_id,usd_cents,held_cents) VALUES(?,0,0)');
    $q->execute([$owner]);
    // Opening snapshot = existing current balance. Does NOT grant any additional credits.
    $q=$db->prepare("INSERT OR IGNORE INTO demo_money_ops(op_key,owner_id,kind,created_at)
        VALUES(?,?,'opening_snapshot',?)");
    $key='opening:'.$owner;$q->execute([$key,$owner,gmdate('c')]);
    if ($q->rowCount()===1) {
        $b=$db->prepare('SELECT credits FROM demo_owners WHERE id=?');$b->execute([$owner]);
        dw_entry($db,$key,$owner,'CR','available',(int)$b->fetchColumn());
    }
}
function dw_key(string $prefix='op'): string { return $prefix.':'.bin2hex(random_bytes(16)); }
function dw_operation(PDO $db,string $key,string $owner,string $kind): bool {
    if (!preg_match('/^[a-zA-Z0-9:._-]{8,120}$/D',$key))throw new InvalidArgumentException('Clave de operación inválida');
    $q=$db->prepare('SELECT owner_id,kind FROM demo_money_ops WHERE op_key=?');$q->execute([$key]);
    $existing=$q->fetch();
    if ($existing) {
        if ($existing['owner_id']!==$owner||$existing['kind']!==$kind)throw new DomainException('Clave utilizada por otra operación');
        return false;
    }
    $q=$db->prepare('INSERT INTO demo_money_ops(op_key,owner_id,kind,created_at) VALUES(?,?,?,?)');
    $q->execute([$key,$owner,$kind,gmdate('c')]);return true;
}
function dw_entry(PDO $db,string $key,string $owner,string $currency,string $bucket,int $delta): void {
    $q=$db->prepare('INSERT INTO demo_money_entries(op_key,owner_id,currency,bucket,delta,created_at) VALUES(?,?,?,?,?,?)');
    $q->execute([$key,$owner,$currency,$bucket,$delta,gmdate('c')]);
}
function dw_change(PDO $db,string $owner,string $currency,string $bucket,int $delta): void {
    if ($currency==='CR' && $bucket==='available') {
        $q=$db->prepare('UPDATE demo_owners SET credits=credits+? WHERE id=? AND credits+?>=0 AND credits+?<=?');
        $q->execute([$delta,$owner,$delta,$delta,DEMO_MAX]);
    } elseif($currency==='USD_CENTS' && in_array($bucket,['available','held'],true)){
        $field=$bucket==='available'?'usd_cents':'held_cents';
        $q=$db->prepare("UPDATE demo_cash SET $field=$field+? WHERE owner_id=? AND $field+?>=0 AND $field+?<=?");
        $q->execute([$delta,$owner,$delta,$delta,DEMO_MAX]);
    } else throw new InvalidArgumentException('Moneda o compartimento inválido');
    if($q->rowCount()!==1)throw new DomainException('Saldo insuficiente o límite de demo alcanzado');
}
function dw_move(PDO $db,string $owner,string $key,string $currency,string $bucket,int $delta): void {
    dw_change($db,$owner,$currency,$bucket,$delta);dw_entry($db,$key,$owner,$currency,$bucket,$delta);
}
function dw_balances(PDO $db,string $owner): array {
    $q=$db->prepare('SELECT o.alias,o.credits,c.usd_cents,c.held_cents FROM demo_owners o JOIN demo_cash c ON c.owner_id=o.id WHERE o.id=?');
    $q->execute([$owner]);return $q->fetch()?:[];
}
function dw_stables_debit(PDO $db,string $owner,int $cost,string $key,string $action): void {
    // Same transaction as stable creation. Existing demo_wallet_ops is retained for old API idempotency.
    // Key domain separated from the global operations table.
    $op='stable:'.$key;
    if (!dw_operation($db,$op,$owner,'stable_'.$action))throw new DomainException('Débito de escudería ya aplicado');
    dw_move($db,$owner,$op,'CR','available',-$cost);
}
