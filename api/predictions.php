<?php
declare(strict_types=1);
/** Strict, same-origin API for simulated predictions using verified Google sessions. */
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header('Permissions-Policy: payment=()');
require_once __DIR__.'/../predictions/lib.php';

function predictionsRespond(int $code,array $value): never {
    http_response_code($code);
    echo json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}
function predictionsFail(int $code,string $message): never {
    predictionsRespond($code,['status'=>'error','message'=>$message,'simulation'=>true]);
}
function predictionsSessionUser(): int {
    $user=$_SESSION['user_id'] ?? null;
    if(!is_int($user) || $user<=0) predictionsFail(401,'Iniciá sesión con identidad verificada');
    return $user;
}
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>true,
    'httponly'=>true,'samesite'=>'Lax']);
ini_set('session.use_strict_mode','1');
session_start();
$method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
$action=$_GET['action'] ?? 'races';
if(!is_string($action)) predictionsFail(400,'Acción inválida');
try {
    if($method==='GET') {
        if(!in_array($action,['races','me'],true)) predictionsFail(404,'Acción desconocida');
        $service=CrpPredictions::fromEnvironment();
        if($action==='races') {
            predictionsRespond(200,['status'=>'success','simulation'=>true,
                'notice'=>'Pronósticos con créditos ficticios sin valor ni canje.',
                'races'=>$service->upcoming(time()),'server_time'=>time(),
                'multipliers'=>['winner'=>4,'podium'=>25,'exacta'=>30,'trifecta'=>150]]);
        }
        $user=predictionsSessionUser();
        if(!isset($_SESSION['predictions_csrf'])) $_SESSION['predictions_csrf']=bin2hex(random_bytes(32));
        predictionsRespond(200,['status'=>'success','csrf'=>$_SESSION['predictions_csrf'],
            'account'=>$service->personal($user,time())]);
    }
    if($method!=='POST') {
        header('Allow: GET, POST');
        predictionsFail(405,'Método no permitido');
    }
    if($action!=='confirm') predictionsFail(404,'Acción desconocida');
    $user=predictionsSessionUser();
    if(strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE'] ?? '')[0]))!=='application/json')
        predictionsFail(415,'Se requiere application/json');
    $origin=$_SERVER['HTTP_ORIGIN'] ?? '';
    $host=$_SERVER['HTTP_HOST'] ?? '';
    if(!$host || $origin!=='https://'.$host)
        predictionsFail(403,'Origen no autorizado');
    $csrf=$_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if(!is_string($csrf) || !isset($_SESSION['predictions_csrf']) ||
       !hash_equals($_SESSION['predictions_csrf'],$csrf))
        predictionsFail(403,'Protección CSRF requerida');
    $body=file_get_contents('php://input',false,null,0,4097);
    if(!is_string($body) || strlen($body)>4096) predictionsFail(413,'Solicitud demasiado grande');
    $input=json_decode($body,true);
    if(!is_array($input) || array_is_list($input)) predictionsFail(400,'JSON inválido');
    // Browser-session throttle. The DB guards replay, overspending and concurrent requests.
    $minute=intdiv(time(),60);
    $rate=$_SESSION['predictions_rate'] ?? ['minute'=>$minute,'count'=>0];
    if($rate['minute']!==$minute) $rate=['minute'=>$minute,'count'=>0];
    if($rate['count']>=15) predictionsFail(429,'Demasiadas confirmaciones por minuto');
    $rate['count']++;
    $_SESSION['predictions_rate']=$rate;
    $service=CrpPredictions::fromEnvironment();
    $ticket=$service->confirm($user,$input,time());
    predictionsRespond(201,['status'=>'success','simulation'=>true,'ticket'=>$ticket]);
} catch(PredictionFailure $e) {
    predictionsFail($e->http,$e->getMessage());
} catch(Throwable $e) {
    error_log('CRP predictions internal error: '.get_class($e));
    predictionsFail(503,'Servicio temporalmente no disponible');
}
