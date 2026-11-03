<?php
declare(strict_types=1);

/**
 * Servicio INTERNO: invocar solamente desde eventos validados por el servidor.
 * Nunca exponer awardEvent como endpoint público.
 */
final class AchievementService
{
    private const ALLOWED = [
        'account_created', 'first_visit', 'race_watched', 'finish_watched',
        'replay_watched', 'racer_viewed', 'project_history_read',
        'weather_race_watched', 'profile_completed', 'favorite_added',
        'badges_showcased', 'post_approved', 'event_day_attended'
    ];

    /**
     * Idempotente por (user_id,event_key), incluso ante solicitudes simultáneas.
     * La identidad y la veracidad del evento deben estar comprobadas ANTES de llamar.
     * @return string[] códigos desbloqueados por esta invocación
     */
    public static function awardEvent(PDO $pdo, int $userId, string $eventType, string $eventKey): array
    {
        if ($userId < 1 || !in_array($eventType, self::ALLOWED, true)) {
            throw new InvalidArgumentException('Usuario o evento inválido');
        }
        if (strlen($eventKey) < 4 || strlen($eventKey) > 160 || !preg_match('/^[a-zA-Z0-9:._-]+$/D', $eventKey)) {
            throw new InvalidArgumentException('Clave de evento inválida');
        }
        $pdo->beginTransaction();
        try {
            $insert = $pdo->prepare('INSERT IGNORE INTO community_events (user_id,event_key,event_type) VALUES (?,?,?)');
            $insert->execute([$userId,$eventKey,$eventType]);
            if ($insert->rowCount() === 0) {
                $pdo->commit();
                return [];
            }
            $progress = $pdo->prepare('INSERT INTO achievement_progress (user_id,event_type,total) VALUES (?,?,1) ON DUPLICATE KEY UPDATE total=total+1');
            $progress->execute([$userId,$eventType]);
            $query = $pdo->prepare('SELECT d.code FROM achievement_definitions d JOIN achievement_progress p ON p.user_id=? AND p.event_type=d.event_type WHERE d.event_type=? AND d.is_active=1 AND p.total>=d.target_count');
            $query->execute([$userId,$eventType]);
            $codes = $query->fetchAll(PDO::FETCH_COLUMN);
            $award = $pdo->prepare('INSERT IGNORE INTO user_achievements (user_id,achievement_code) VALUES (?,?)');
            $new = [];
            foreach ($codes as $code) {
                $award->execute([$userId,$code]);
                if ($award->rowCount() === 1) $new[] = $code;
            }
            $pdo->commit();
            return $new;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }

    /** Asignación administrativa de logros especiales, no expuesta a clientes. */
    public static function grantSpecial(PDO $pdo, int $userId, string $code): bool
    {
        if ($userId < 1 || !in_array($code,['opening_day'],true)) throw new InvalidArgumentException('Logro especial inválido');
        $stmt = $pdo->prepare('INSERT IGNORE INTO user_achievements (user_id,achievement_code) VALUES (?,?)');
        $stmt->execute([$userId,$code]);
        return $stmt->rowCount() === 1;
    }

    /** Mostrar de 0 a 3 insignias propias, en transacción para evitar colisiones. */
    public static function setShowcase(PDO $pdo, int $userId, array $codes): void
    {
        if ($userId < 1 || count($codes) > 3 || count($codes) !== count(array_unique($codes))) {
            throw new InvalidArgumentException('Vitrina inválida');
        }
        foreach ($codes as $code) if (!is_string($code) || !preg_match('/^[a-z0-9_]{1,40}$/D',$code)) {
            throw new InvalidArgumentException('Código inválido');
        }
        $pdo->beginTransaction();
        try {
            $lock = $pdo->prepare('SELECT achievement_code FROM user_achievements WHERE user_id=? FOR UPDATE');
            $lock->execute([$userId]);
            $owned = $lock->fetchAll(PDO::FETCH_COLUMN);
            foreach ($codes as $code) if (!in_array($code,$owned,true)) throw new DomainException('Insignia no desbloqueada');
            $clear = $pdo->prepare('UPDATE user_achievements SET showcase_slot=NULL WHERE user_id=? AND showcase_slot IS NOT NULL');
            $clear->execute([$userId]);
            $set = $pdo->prepare('UPDATE user_achievements SET showcase_slot=? WHERE user_id=? AND achievement_code=?');
            foreach (array_values($codes) as $index=>$code) $set->execute([$index+1,$userId,$code]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
}
