/**
 * Optional screenshots of continuously animated WebGL on SwiftShader.
 *
 * In CI, screenshot timeouts can leave Chromium's compositor locked even
 * after Playwright catches the timeout. Subsequent user-action assertions
 * then time out waiting for element stability or scheduled navigation.
 *
 * Therefore never ask the software GPU for optional captures during
 * functional CI. To collect visual artifacts on a graphics-capable runner,
 * opt in explicitly: CRP_CAPTURE_WEBGL_SCREENSHOTS=1.
 *
 * All assertions for camera, replay, results, WebGL and controls remain
 * mandatory. The Satoshi TV browser suite has its own required screenshots.
 */
export async function captureOptional(page,path,{timeout=7000}={}){
 if(process.env.CRP_CAPTURE_WEBGL_SCREENSHOTS!=='1'){
  console.log('VISUAL_EVIDENCE_SKIPPED_SOFTWARE_GPU',path);
  return false;
 }
 try{
  await page.screenshot({path,timeout,animations:'disabled',caret:'hide'});
  return true;
 }catch(error){
  console.warn('VISUAL_EVIDENCE_UNAVAILABLE',path,String(error?.message||error));
  return false;
 }
}
