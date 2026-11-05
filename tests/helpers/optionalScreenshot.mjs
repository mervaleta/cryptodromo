/**
 * Best-effort visual evidence for continuously animated WebGL scenarios.
 * A SwiftShader compositor may stop servicing Page.captureScreenshot even
 * after all scene/score assertions have passed. Do NOT let an optional
 * artifact suppress the meaningful test results. Preserve a warning so
 * missing visual evidence is still visible in Actions logs.
 *
 * This helper never replaces a functional assertion.
 */
export async function captureOptional(page,path,{timeout=7000}={}){
 try{
  await page.screenshot({path,timeout,animations:'disabled',caret:'hide'});
  return true;
 }catch(error){
  console.warn('VISUAL_EVIDENCE_UNAVAILABLE',path,String(error?.message||error));
  return false;
 }
}
