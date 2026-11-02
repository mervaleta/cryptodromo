/** Optional UI adapter for the standalone trackSplits scorer. No Three.js dependency. */
import {buildTrackSplits,splitSnapshot} from '../race-lab/source/src/data/trackSplits.js';
const el=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  return node;
};
const stamp=seconds=>seconds===null?'--.---':seconds.toFixed(3)+' s';
export function mountTrackSplitsPanel(root,{mode='legacy'}={}) {
  if(!root)throw new Error('Missing split panel container');
  root.classList.add('crp-split-panel');
  let scores=null;
  let lastKey='';
  function setRace(profiles,{mode:nextMode=mode}={}) {
    mode=nextMode;
    scores=buildTrackSplits(profiles,{mode});
    lastKey='';
    update(0);
    return scores;
  }
  function update(elapsedSeconds,{finishAuthorized=false}={}) {
    if(!scores)return null;
    // Renders at 2Hz at most during an animated race; the racing loop remains unblocked.
    const second=Math.floor(Math.max(0,Number(elapsedSeconds)||0)*2)/2;
    const key=second+'|'+Boolean(finishAuthorized);
    if(key===lastKey)return null;
    lastKey=key;
    const state=splitSnapshot(scores,second,{finishAuthorized});
    const title=el('div','crp-split-heading');
    title.append(el('strong','', 'PARCIALES DE PISTA'),el('small','', scores.modeLabel.toUpperCase()));
    const checkpoints=el('div','crp-split-checkpoints');
    for(const split of state.checkpoints){
      const item=el('div','crp-split-checkpoint'+(split.visible?' crp-split-hit':''));
      item.append(el('span','crp-split-meter',split.meters+' m'));
      item.append(el('b','',split.visible?split.record:'PENDIENTE'));
      item.append(el('span','crp-split-time',split.visible?stamp(split.recordSeconds):'--.---'));
      if(split.bonus)item.append(el('small','',split.visible?'+1 punto al líder':'BONUS +1'));
      else item.append(el('small','','META · RESULTADO OFICIAL'));
      checkpoints.append(item);
    }
    const heading=el('div','crp-split-subheading');
    heading.append(el('b','',state.finishVisible?'CLASIFICACIÓN OFICIAL':'LÍDERES DE SPLITS'),
      el('span','',state.finishVisible?'Puntos de carrera y bonus':'Bonus provisionales; llegada aún no publicada'));
    const entries=el('ol','crp-split-standings');
    for(const runner of state.standings){
      const line=el('li','crp-split-runner');
      line.style.setProperty('--runner-color',runner.color);
      line.append(el('span','crp-split-rank',runner.position===null?'·':runner.position));
      const label=el('a','crp-split-symbol',runner.symbol);
      label.href='/racers/#'+encodeURIComponent(runner.symbol);
      label.title=runner.name;
      line.append(label);
      line.append(el('span','crp-split-bonus','+'+runner.bonusPoints+' split'));
      line.append(el('strong','crp-split-points',state.finishVisible?runner.totalPoints+' pts':'···'));
      entries.append(line);
    }
    root.replaceChildren(title,checkpoints,heading,entries);
    return state;
  }
  function dispose(){scores=null;lastKey='';root.replaceChildren();root.classList.remove('crp-split-panel');}
  return {setRace,update,dispose};
}
