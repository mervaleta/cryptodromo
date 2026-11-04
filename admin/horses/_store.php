<?php
declare(strict_types=1);
/** Shared storage/validation for private editing and public read-only publication. */
function horse_reply(array $payload, int $status=200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function horse_problem(string $message, int $status=400): never {
    horse_reply(['ok'=>false,'error'=>$message],$status);
}
function horse_storage(): array {
    $dir=dirname(__DIR__,3).'/cryptodromo-horses-private';
    if (PHP_SAPI==='cli-server' && getenv('CRP_HORSES_TEST_DIR')) {
        $dir=(string)getenv('CRP_HORSES_TEST_DIR');
    }
    return [$dir,$dir.'/profiles-v1.json'];
}
function horse_catalog(): array {
    $fixturePath=dirname(__DIR__,2).'/stables/official-week-v1.json';
    if (PHP_SAPI==='cli-server' && getenv('CRP_HORSES_TEST_CATALOG')) {
        $fixturePath=(string)getenv('CRP_HORSES_TEST_CATALOG');
    }
    $catalog=json_decode((string)@file_get_contents($fixturePath),true);
    $symbols=$catalog['symbols']??null;
    if (!is_array($symbols)||count($symbols)!==100||count(array_unique($symbols))!==100) {
        horse_problem('El catálogo oficial de 100 corredores no está disponible',503);
    }
    foreach ($symbols as $symbol) {
        if (!is_string($symbol)||!preg_match('/^[A-Z0-9]{1,12}$/D',$symbol)) horse_problem('Catálogo inválido',503);
    }
    return $symbols;
}
function horse_empty_state(): array {
    return ['revision'=>0,'publishedRevision'=>0,'drafts'=>[],'published'=>[],'publishedAt'=>null];
}
function horse_read_state(string $file): array {
    if (!is_file($file)) return horse_empty_state();
    $contents=@file_get_contents($file);
    if ($contents===false) horse_problem('No se pudo leer el almacenamiento',503);
    $state=json_decode($contents,true);
    if (!is_array($state)||!is_int($state['revision']??null)||!is_int($state['publishedRevision']??null)
        ||!is_array($state['drafts']??null)||!is_array($state['published']??null)) {
        horse_problem('Estado de caballos corrupto; no se sobrescribió',503);
    }
    return $state;
}
function horse_string(mixed $value, int $max, string $field): string {
    if (!is_string($value)||strlen($value)>$max*4)horse_problem("Campo $field inválido");
    $value=trim($value);
    if (!preg_match('//u',$value)||mb_length($value)>$max||preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/',$value))horse_problem("Campo $field inválido");
    return $value;
}
function mb_length(string $s): int {
    return function_exists('mb_strlen')?mb_strlen($s,'UTF-8'):strlen($s);
}
function horse_hex(mixed $value, string $field): ?string {
    if ($value===null||$value==='')return null;
    if (!is_string($value)||!preg_match('/^#[a-fA-F0-9]{6}$/D',$value))horse_problem("Color $field inválido");
    return strtolower($value);
}
function horse_url(mixed $value,string $field): string {
    $url=horse_string($value,350,$field);
    if ($url==='')return '';
    if (!filter_var($url,FILTER_VALIDATE_URL))horse_problem("Enlace $field inválido");
    $parts=parse_url($url);
    if (!is_array($parts)||!in_array(strtolower((string)($parts['scheme']??'')),['http','https'],true)
        ||empty($parts['host'])||isset($parts['user'])||isset($parts['pass']))horse_problem("Enlace $field inválido");
    return $url;
}
function horse_exact_keys(array $data,array $allowed,string $name): void {
    foreach (array_keys($data) as $key) {
        if (!is_string($key)||!in_array($key,$allowed,true))horse_problem("Campo inesperado en $name");
    }
}
function horse_validate_profile(mixed $input): array {
    if (!is_array($input)||array_is_list($input))horse_problem('Ficha inválida');
    horse_exact_keys($input,['name','nickname','tagline','biography','networks','links','logoId','appearance'],'ficha');
    foreach (['name','nickname','tagline','biography','networks','links','appearance'] as $field) {
        if (!array_key_exists($field,$input))horse_problem("Falta el campo $field");
    }
    $appearance=$input['appearance'];
    $colorFields=['raceColor','coatColor','muzzleColor','maneColor','tailColor','hoofColor','eyeColor','legsColor','bridleColor'];
    if (!is_array($appearance)||array_is_list($appearance))horse_problem('Apariencia inválida');
    horse_exact_keys($appearance,[...$colorFields,'appearanceMode','maneStyle','tailStyle','maneScale','tailScale'],'apariencia');
    $colors=[];
    foreach ($colorFields as $key) $colors[$key]=horse_hex($appearance[$key]??null,$key);
    $mode=$appearance['appearanceMode']??'brand_colored';
    if (!in_array($mode,['brand_colored','natural_coat'],true))horse_problem('Modo de pelaje inválido');
    // Exactly three lengths. Volume is an independent setting.
    $maneStyle=$appearance['maneStyle']??'medium';$tailStyle=$appearance['tailStyle']??'medium';
    foreach ([$maneStyle,$tailStyle] as $style)if (!in_array($style,['short','medium','long'],true))horse_problem('Largo de pelo inválido');
    foreach (['maneScale','tailScale'] as $scalar) {
        if (!isset($appearance[$scalar])||!is_numeric($appearance[$scalar])||!is_finite((float)$appearance[$scalar])
            ||(float)$appearance[$scalar]<0.65||(float)$appearance[$scalar]>1.85)horse_problem("Valor $scalar fuera de rango");
    }
    $networkRows=$input['networks'];
    if (!is_array($networkRows)||!array_is_list($networkRows)||count($networkRows)>12)horse_problem('Redes inválidas');
    $networks=[];$seen=[];
    foreach ($networkRows as $row) {
        if (!is_array($row)||array_is_list($row))horse_problem('Red inválida');
        horse_exact_keys($row,['name','contract','explorer'],'red');
        $name=horse_string($row['name']??'',60,'red');
        if ($name==='')horse_problem('La red necesita nombre');
        $slug=strtolower($name);
        if(isset($seen[$slug]))horse_problem('Red duplicada');
        $seen[$slug]=true;
        $networks[]=['name'=>$name,'contract'=>horse_string($row['contract']??'',130,'contrato'),'explorer'=>horse_url($row['explorer']??'','explorador')];
    }
    $links=$input['links'];
    if (!is_array($links)||array_is_list($links))horse_problem('Enlaces inválidos');
    horse_exact_keys($links,['website','x','telegram','discord'],'enlaces');
    $urls=[];
    foreach (['website','x','telegram','discord'] as $key)$urls[$key]=horse_url($links[$key]??'',$key);
    return [
        'name'=>horse_string($input['name'],80,'nombre'),
        'nickname'=>horse_string($input['nickname'],80,'apodo'),
        'tagline'=>horse_string($input['tagline'],160,'lema'),
        'biography'=>horse_string($input['biography'],1800,'biografía'),
        'networks'=>$networks,'links'=>$urls,'logoId'=>horse_validate_logo($input['logoId']??null),
        'appearance'=>[...$colors,'appearanceMode'=>$mode,'maneStyle'=>$maneStyle,'tailStyle'=>$tailStyle,
            'maneScale'=>round((float)$appearance['maneScale'],2),'tailScale'=>round((float)$appearance['tailScale'],2)]
    ];
}


/** Logo names are immutable SHA-256 identifiers; extensions never come from user input. */
function horse_logo_path(string $id): ?array {
    if (!preg_match('/^[a-f0-9]{64}$/D',$id)) return null;
    [$dir]=horse_storage();
    $mimes=['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'];
    foreach ($mimes as $extension=>$mime) {
        $path=$dir.'/logos/'.$id.'.'.$extension;
        if (is_file($path)) return ['path'=>$path,'mime'=>$mime];
    }
    return null;
}
function horse_validate_logo(mixed $id): ?string {
    if ($id===null||$id==='')return null;
    if (!is_string($id)||!preg_match('/^[a-f0-9]{64}$/D',$id)||horse_logo_path($id)===null)
        horse_problem('Logo inválido o no cargado');
    return $id;
}
function horse_output_logo(string $id,bool $public): never {
    $asset=horse_logo_path($id);
    if ($asset===null){http_response_code(404);exit;}
    header('Content-Type: '.$asset['mime']);
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; sandbox");
    header($public?'Cache-Control: public, max-age=20, must-revalidate':'Cache-Control: private, no-store');
    header('Content-Length: '.(string)filesize($asset['path']));
    if(($_SERVER['REQUEST_METHOD']??'GET')!=='HEAD')readfile($asset['path']);
    exit;
}
