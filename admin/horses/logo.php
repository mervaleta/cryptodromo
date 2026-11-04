<?php
declare(strict_types=1);
/** Authenticated preview: draft logos must never be obtainable via the public endpoint. */
require __DIR__.'/../fixture/_auth.php';
require __DIR__.'/_store.php';
if (!in_array($_SERVER['REQUEST_METHOD']??'GET',['GET','HEAD'],true)){http_response_code(405);exit;}
$id=$_GET['id']??null;
if (!is_string($id)||!preg_match('/^[a-f0-9]{64}$/D',$id)){http_response_code(404);exit;}
horse_output_logo($id,false);
