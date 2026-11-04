<?php
declare(strict_types=1);
/** Only published logos are public, addressed by their official racing symbol. */
require dirname(__DIR__).'/admin/horses/_store.php';
if (!in_array($_SERVER['REQUEST_METHOD']??'GET',['GET','HEAD'],true)){http_response_code(405);exit;}
$symbol=$_GET['symbol']??null;
if (!is_string($symbol)||!in_array($symbol,horse_catalog(),true)){http_response_code(404);exit;}
[, $file]=horse_storage();
$state=horse_read_state($file);
$id=$state['published'][$symbol]['logoId']??null;
if (!is_string($id)||!preg_match('/^[a-f0-9]{64}$/D',$id)){http_response_code(404);exit;}
horse_output_logo($id,true);
