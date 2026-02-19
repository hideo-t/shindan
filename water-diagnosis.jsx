import { useState, useCallback, useMemo, useEffect, useRef } from "react";

const Q = [
  { id:"a1", sec:"家族構成", icon:"👤", q:"お住まいの住居タイプは？",
    opts:[
      { t:"戸建て（持ち家）", s:1, tag:"house" },
      { t:"マンション・集合住宅", s:2, tag:"apt" },
      { t:"賃貸アパート", s:3, tag:"rental" },
      { t:"高層マンション（10階以上）", s:4, tag:"high" },
    ], next:"a2" },
  { id:"a2", sec:"家族構成", icon:"👤", q:"同居している家族の人数は？（自分を含む）",
    opts:[
      { t:"1人（一人暮らし）", s:1, tag:"solo", fam:1 },
      { t:"2人", s:2, tag:"pair", fam:2 },
      { t:"3〜4人", s:3, tag:"family", fam:4 },
      { t:"5人以上", s:4, tag:"big", fam:6 },
    ], next:"a3" },
  { id:"a3", sec:"家族構成", icon:"👤", q:"家族に要配慮者はいますか？",
    sub:"（乳幼児・高齢者・持病のある方・妊婦など）",
    opts:[
      { t:"いる（複数名）", s:5, tag:"vm" },
      { t:"いる（1名）", s:3, tag:"vs" },
      { t:"いないが、ペットがいる", s:2, tag:"pet" },
      { t:"いない", s:0, tag:"no" },
    ], next:"b1" },
  { id:"b1", sec:"備蓄の現状", icon:"💧", q:"現在、飲料水の備蓄はどのくらいありますか？",
    opts:[
      { t:"ほぼない / 考えたことがない", s:5, tag:"zero" },
      { t:"500mlペットボトルが数本ある程度", s:4, tag:"few" },
      { t:"2L×6本（1ケース）程度", s:2, tag:"case" },
      { t:"1人1日3L × 3日分以上を確保", s:0, tag:"ok" },
    ], next: o => o.tag==="ok" ? "b1x" : "b2" },
  { id:"b1x", sec:"備蓄の現状", icon:"💧", q:"その備蓄水の管理方法は？",
    opts:[
      { t:"ローリングストック（消費しながら補充）", s:0, tag:"roll" },
      { t:"保管しているが期限は把握済み", s:1, tag:"ok" },
      { t:"正直、期限を確認していない…", s:3, tag:"bad" },
    ], next:"b2" },
  { id:"b2", sec:"備蓄の現状", icon:"💧", q:"飲料水以外の「生活用水」の備えはありますか？",
    sub:"（手洗い・トイレ・調理・身体を拭く用など）",
    opts:[
      { t:"まったくしていない", s:5, tag:"none" },
      { t:"お風呂に水を張っている程度", s:3, tag:"bath" },
      { t:"ポリタンクや雨水タンクを用意", s:1, tag:"tank" },
      { t:"浄水器など「水を作る手段」がある", s:0, tag:"pur" },
    ], next: o => o.tag==="pur" ? "b2x" : "c1" },
  { id:"b2x", sec:"備蓄の現状", icon:"💧", q:"お持ちの浄水器はどのタイプですか？",
    opts:[
      { t:"携帯ストロー型（ソーヤーミニ等）", s:2, tag:"straw" },
      { t:"ボトル型・ポンプ型", s:1, tag:"bottle" },
      { t:"据え置き型（重力式・タンク型）", s:0, tag:"gravity" },
    ], next:"c1" },
  { id:"c1", sec:"行動パターン", icon:"🏃", q:"もし今、自宅で断水が起きたら最初に何をしますか？",
    opts:[
      { t:"とりあえずコンビニ/スーパーに走る", s:5, tag:"run" },
      { t:"SNSやニュースで情報を確認する", s:3, tag:"info" },
      { t:"備蓄水を確認し、使用計画を立てる", s:1, tag:"plan" },
      { t:"備蓄と浄水手段があるのでまず落ち着く", s:0, tag:"calm" },
    ], next: o => o.tag==="run" ? "c1x" : "c2" },
  { id:"c1x", sec:"行動パターン", icon:"🏃",
    q:"大地震の直後、スーパーの棚から水が消えていました。次にどうしますか？",
    opts:[
      { t:"他の店を探し回る", s:4, tag:"search" },
      { t:"給水車が来るのを待つ", s:3, tag:"wait" },
      { t:"近所の人に分けてもらう", s:2, tag:"share" },
      { t:"正直、途方に暮れると思う…", s:5, tag:"stuck" },
    ], next:"c2" },
  { id:"c2", sec:"行動パターン", icon:"🏃", q:"給水車が来ました。あなたの対応は？",
    opts:[
      { t:"鍋やバケツで並ぶ（容器がない）", s:5, tag:"nope" },
      { t:"ペットボトルを持って並ぶ", s:4, tag:"pet" },
      { t:"ポリタンクはあるが運搬手段がない", s:3, tag:"nocart" },
      { t:"ポリタンク＋キャリーカートで効率よく運ぶ", s:0, tag:"full" },
    ], next:"c3" },
  { id:"c3", sec:"行動パターン", icon:"🏃", q:"断水が続いています。トイレはどうしますか？",
    opts:[
      { t:"考えたことがない / わからない", s:5, tag:"noidea" },
      { t:"備蓄水やお風呂の水で流す", s:3, tag:"flush" },
      { t:"簡易トイレを使う", s:1, tag:"port" },
      { t:"簡易トイレ＋水を節約する工夫がある", s:0, tag:"full" },
    ], next:"d1" },
  { id:"d1", sec:"知識と想像力", icon:"🧠",
    q:"大規模地震後、水道が復旧するまでどのくらいかかると思いますか？",
    opts:[
      { t:"1〜2日くらいでは？", s:5, tag:"1d" },
      { t:"1週間程度", s:3, tag:"1w" },
      { t:"数週間〜1ヶ月", s:1, tag:"1m" },
      { t:"数ヶ月かかることもある", s:0, tag:"mo" },
    ], next: o => o.tag==="1d" ? "d1x" : "d2" },
  { id:"d1x", sec:"知識と想像力", icon:"🧠",
    q:"2024年の能登半島地震では水道復旧に数ヶ月かかりました。この事実を知っていましたか？",
    opts:[
      { t:"知らなかった…", s:3, tag:"no" },
      { t:"聞いたことはあったが実感がなかった", s:2, tag:"vague" },
    ], next:"d2" },
  { id:"d2", sec:"知識と想像力", icon:"🧠",
    q:"人間の体は水分を何%失うと命に関わると思いますか？",
    opts:[
      { t:"よくわからない", s:4, tag:"?" },
      { t:"20%くらい？", s:3, tag:"wrong" },
      { t:"10%で意識障害、それ以上で死亡リスク", s:0, tag:"ok" },
    ], next:"d3" },
  { id:"d3", sec:"知識と想像力", icon:"🧠",
    q:"「避難所に行けば水はもらえる」と思いますか？",
    opts:[
      { t:"はい、行政が用意してくれるはず", s:5, tag:"dep" },
      { t:"もらえるだろうが量は限られると思う", s:2, tag:"mid" },
      { t:"避難所もパニック。自力確保が前提", s:0, tag:"self" },
    ], next:"e1" },
  { id:"e1", sec:"盲点チェック", icon:"🔍",
    q:"以下のアイテム、自宅にいくつありますか？",
    sub:"ラップ（食器保護用）/ 大判ウェットティッシュ / キャリーカート / 簡易トイレ / カセットコンロ",
    opts:[
      { t:"0〜1つ", s:5, tag:"0" },
      { t:"2〜3つ", s:2, tag:"2" },
      { t:"4つ以上", s:0, tag:"4" },
    ], next:"e2" },
  { id:"e2", sec:"盲点チェック", icon:"🔍",
    q:"水道水の「PFAS（有機フッ素化合物）」汚染問題を知っていますか？",
    opts:[
      { t:"聞いたことがない", s:3, tag:"no" },
      { t:"ニュースで見たことはある", s:2, tag:"heard" },
      { t:"知っていて、対策を考えている", s:0, tag:"aware" },
    ], next:"e3" },
  { id:"e3", sec:"盲点チェック", icon:"🔍",
    q:"最後の質問です。近くの川や池の水を飲み水にできたら、安心感は変わりますか？",
    opts:[
      { t:"かなり安心感が増す", s:0, tag:"very" },
      { t:"あれば便利だと思う", s:0, tag:"nice" },
      { t:"あまり必要性を感じない", s:0, tag:"nah" },
    ], next:null },
];

const SECS=["家族構成","備蓄の現状","行動パターン","知識と想像力","盲点チェック"];
const SICO={"家族構成":"👤","備蓄の現状":"💧","行動パターン":"🏃","知識と想像力":"🧠","盲点チェック":"🔍"};

function calc(sc,mx,ans){
  const pct=mx>0?Math.round(sc/mx*100):0;
  const fm=ans.a2?.fam||1, dy=fm*3, wk=dy*7;
  const ss={},sm={};
  for(const k in ans){const qd=Q.find(x=>x.id===k);if(!qd)continue;const s=qd.sec,m=Math.max(...qd.opts.map(o=>o.s));ss[s]=(ss[s]||0)+(ans[k]?.s||0);sm[s]=(sm[s]||0)+m;}
  let ty,ti,co,em,pe,ad;
  if(pct>=60){ty="CRITICAL";ti="危険水域";co="#d64045";em="🚨";pe="困る人";ad=`現在の備えでは、断水24時間以内に深刻な状況に陥る可能性が高いです。家族${fm}人で1日${dy}L、1週間で${wk}L必要ですが、備蓄も行動計画もほぼない状態です。「スーパーに走って空の棚を見て途方に暮れる」——まさにそうなります。`;}
  else if(pct>=35){ty="WARNING";ti="要改善";co="#f59e0b";em="⚠️";pe="一部だけ備えている人";ad=`ある程度の意識はありますが、長期断水には対応しきれません。能登半島地震では復旧に数ヶ月。備蓄が尽きた後の「次の手」がないのが最大のリスクです。`;}
  else{ty="GOOD";ti="備え良好";co="#22c55e";em="✅";pe="備えている人";ad=`高い防災意識をお持ちです。ただし備蓄水には限界があります。浄水器があれば川の水や雨水からも飲料水を確保でき、「水を作れる力」で備蓄切れの不安を完全に解消できます。`;}
  const gaps=[];for(const s of SECS){if(sm[s]>0){const p=Math.round(ss[s]/sm[s]*100);if(p>=40)gaps.push({sec:s,pct:p,icon:SICO[s]});}}
  gaps.sort((a,b)=>b.pct-a.pct);
  return{ty,ti,co,em,pe,ad,pct,fm,dy,wk,gaps,ss,sm,interest:ans.e3?.tag};
}

function Gauge({pct,color}){
  const r=52,c=2*Math.PI*r;
  const[a,sA]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>sA(pct),150);return()=>clearTimeout(t);},[pct]);
  return(
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#141e2e" strokeWidth="9"/>
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={c} strokeDashoffset={c-c*a/100}
        strokeLinecap="round" transform="rotate(-90 65 65)"
        style={{transition:"stroke-dashoffset 1s ease-out"}}/>
      <text x="65" y="60" textAnchor="middle" fill={color} fontSize="26" fontWeight="900" fontFamily="inherit">{pct}</text>
      <text x="65" y="78" textAnchor="middle" fill="#5a6a7e" fontSize="9" fontFamily="inherit">リスクスコア</text>
    </svg>
  );
}

export default function App(){
  const[cur,sC]=useState("a1");
  const[ans,sA]=useState({});
  const[sc,sS]=useState(0);
  const[mx,sM]=useState(0);
  const[hi,sH]=useState([]);
  const[done,sD]=useState(false);
  const[pk,sP]=useState(null);
  const[vis,sV]=useState(true);
  const ref=useRef(null);

  const qd=useMemo(()=>Q.find(q=>q.id===cur),[cur]);
  const si=qd?SECS.indexOf(qd.sec):SECS.length;
  const cnt=Object.keys(ans).length;
  const prog=done?100:Math.round(cnt/Q.length*100);

  const pick=useCallback((o,i)=>{
    if(pk!==null)return; sP(i);
    const q=Q.find(x=>x.id===cur);
    const m=Math.max(...q.opts.map(x=>x.s));
    setTimeout(()=>{sV(false);
      setTimeout(()=>{
        const na={...ans,[cur]:o},ns=sc+o.s,nm=mx+m;
        sA(na);sS(ns);sM(nm);sH([...hi,{id:cur,s:sc,m:mx}]);
        const nx=typeof q.next==="function"?q.next(o):q.next;
        if(nx===null)sD(true); else sC(nx);
        sP(null);sV(true);
      },180);
    },300);
  },[cur,ans,sc,mx,hi,pk]);

  const back=useCallback(()=>{
    if(!hi.length)return;
    const p=hi[hi.length-1];
    const na={...ans};delete na[p.id];
    sA(na);sS(p.s);sM(p.m);sC(p.id);sH(hi.slice(0,-1));sD(false);
  },[hi,ans]);

  const restart=()=>{sC("a1");sA({});sS(0);sM(0);sH([]);sD(false);sP(null);sV(true);};

  const res=done?calc(sc,mx,ans):null;

  useEffect(()=>{if(ref.current)ref.current.scrollTo({top:0,behavior:'smooth'});},[cur,done]);

  const S={
    w:{height:"100vh",display:"flex",flexDirection:"column",background:"linear-gradient(180deg,#060c18,#0c1a2e 45%,#08111f)",fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif",color:"#eef4fa",overflow:"hidden"},
    h:{textAlign:"center",padding:"1.1rem 1rem 0.5rem",flexShrink:0},
    m:{flex:1,overflow:"auto",padding:"0 1rem 2rem",maxWidth:540,margin:"0 auto",width:"100%"},
    c:{background:"rgba(10,20,36,0.93)",border:"1px solid rgba(0,180,216,0.1)",borderRadius:16,padding:"1.2rem",marginBottom:"0.6rem"},
    o:s=>({background:s?"rgba(0,180,216,0.1)":"rgba(255,255,255,0.025)",border:s?"1.5px solid rgba(0,180,216,0.5)":"1.5px solid rgba(200,220,240,0.06)",borderRadius:11,padding:"0.8rem 1rem",color:"#eef4fa",fontSize:"0.84rem",fontWeight:500,textAlign:"left",cursor:"pointer",transition:"all .2s",fontFamily:"inherit",outline:"none",display:"flex",alignItems:"center",gap:"0.55rem"}),
    b:s=>({width:19,height:19,borderRadius:"50%",border:s?"2px solid #00b4d8":"2px solid #2a3648",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.58rem",fontWeight:700,color:s?"#00b4d8":"#3a4a5e",flexShrink:0,background:s?"rgba(0,180,216,0.08)":"transparent",transition:"all .2s"}),
  };

  return(
    <div style={S.w}>
      <div style={S.h}>
        <div style={{fontSize:"0.52rem",letterSpacing:"4px",color:"#00b4d8",fontWeight:700}}>DISASTER PREPAREDNESS CHECK</div>
        <h1 style={{fontSize:"1.3rem",fontWeight:900,margin:"0.25rem 0 0.1rem",lineHeight:1.3}}>
          <span style={{background:"linear-gradient(135deg,#00b4d8,#90e0ef)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>浄水器必要度</span>診断
        </h1>
        <p style={{fontSize:"0.65rem",color:"#4a5a6e",margin:0}}>全問選択式・約3分</p>
      </div>

      <div style={{padding:"0 1.2rem 0.4rem",flexShrink:0,maxWidth:540,margin:"0 auto",width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.15rem"}}>
          {SECS.map((s,i)=>(
            <div key={s} style={{fontSize:"0.48rem",color:i===si?"#00b4d8":i<si?"#2a6a8a":"#1e2e3e",fontWeight:i===si?700:400,textAlign:"center",flex:1,transition:"color .3s"}}>
              <div style={{fontSize:"0.8rem"}}>{SICO[s]}</div>{s}
            </div>
          ))}
        </div>
        <div style={{height:3,background:"#0f1a28",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${prog}%`,background:"linear-gradient(90deg,#00b4d8,#48cae4)",borderRadius:2,transition:"width .5s ease"}}/>
        </div>
      </div>

      <div style={S.m} ref={ref}>
        {!done&&qd&&(
          <div style={{opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(-6px)",transition:"all .18s ease"}}>
            <div style={S.c}>
              <div style={{fontSize:"0.56rem",color:"#00b4d8",fontWeight:700,letterSpacing:"1px",marginBottom:"0.45rem"}}>
                {qd.icon} {qd.sec}<span style={{float:"right",color:"#2a3a4e"}}>Q{cnt+1}</span>
              </div>
              <h2 style={{fontSize:"0.98rem",fontWeight:700,margin:0,lineHeight:1.55}}>{qd.q}</h2>
              {qd.sub&&<p style={{fontSize:"0.68rem",color:"#5a6a7e",marginTop:"0.15rem",marginBottom:0}}>{qd.sub}</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              {qd.opts.map((o,i)=>(
                <button key={i} onClick={()=>pick(o,i)} style={S.o(pk===i)}>
                  <span style={S.b(pk===i)}>{String.fromCharCode(65+i)}</span>{o.t}
                </button>
              ))}
            </div>
            {hi.length>0&&<button onClick={back} style={{background:"none",border:"none",color:"#3a4a5e",fontSize:"0.7rem",cursor:"pointer",marginTop:"0.5rem",fontFamily:"inherit",padding:"0.2rem 0"}}>← 前の質問に戻る</button>}
          </div>
        )}

        {done&&res&&(
          <div style={{animation:"su .45s ease"}}>
            <div style={{background:"rgba(10,20,36,0.96)",border:`1px solid ${res.co}28`,borderRadius:18,padding:"1.3rem",textAlign:"center",marginBottom:"0.6rem",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:res.co}}/>
              <Gauge pct={res.pct} color={res.co}/>
              <div style={{fontSize:"0.52rem",letterSpacing:"3px",color:res.co,fontWeight:700,marginTop:"0.1rem"}}>{res.ty}</div>
              <h2 style={{fontSize:"1.3rem",fontWeight:900,color:res.co,margin:"0.1rem 0 0.15rem"}}>{res.ti}</h2>
              <span style={{display:"inline-block",background:`${res.co}15`,border:`1px solid ${res.co}28`,borderRadius:16,padding:"0.15rem 0.7rem",fontSize:"0.68rem",color:res.co,fontWeight:600,marginBottom:"0.5rem"}}>
                あなたは「{res.pe}」タイプ
              </span>
              <p style={{fontSize:"0.78rem",color:"#a8b8c8",fontWeight:300,lineHeight:1.8,margin:0,textAlign:"left"}}>{res.ad}</p>
            </div>

            {res.gaps.length>0&&(
              <div style={{...S.c,borderColor:"rgba(214,64,69,0.1)"}}>
                <h3 style={{fontSize:"0.76rem",fontWeight:700,color:"#d64045",marginBottom:"0.5rem"}}>⚠️ 弱点セクション</h3>
                {res.gaps.map(g=>(
                  <div key={g.sec} style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.4rem"}}>
                    <span style={{fontSize:"0.85rem"}}>{g.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.1rem"}}>
                        <span style={{fontSize:"0.72rem",fontWeight:600}}>{g.sec}</span>
                        <span style={{fontSize:"0.68rem",color:g.pct>=60?"#d64045":"#f59e0b",fontWeight:700}}>{g.pct}%</span>
                      </div>
                      <div style={{height:3,background:"#141e2e",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${g.pct}%`,background:g.pct>=60?"#d64045":"#f59e0b",borderRadius:2,transition:"width .8s ease"}}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{...S.c,borderColor:"rgba(0,180,216,0.15)"}}>
              <h3 style={{fontSize:"0.76rem",fontWeight:700,color:"#00b4d8",marginBottom:"0.5rem"}}>📊 家族{res.fm}人に必要な水量</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.35rem",textAlign:"center"}}>
                {[{l:"1日分",v:`${res.dy}L`,c:"#00b4d8"},{l:"3日分",v:`${res.dy*3}L`,c:"#f59e0b"},{l:"1週間分",v:`${res.wk}L`,c:"#d64045"}].map(d=>(
                  <div key={d.l} style={{background:"rgba(0,0,0,0.25)",borderRadius:9,padding:"0.6rem 0.2rem"}}>
                    <div style={{fontSize:"1.15rem",fontWeight:900,color:d.c}}>{d.v}</div>
                    <div style={{fontSize:"0.52rem",color:"#5a6a7e"}}>{d.l}</div>
                  </div>
                ))}
              </div>
              <p style={{fontSize:"0.6rem",color:"#3a4a5e",textAlign:"center",margin:"0.4rem 0 0"}}>※飲料・調理のみ。生活用水込みで1人1日10〜20L</p>
            </div>

            <div style={S.c}>
              <h3 style={{fontSize:"0.76rem",fontWeight:700,marginBottom:"0.5rem"}}>🔄 「困る人」vs「備えている人」</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem"}}>
                <div style={{background:"rgba(214,64,69,0.05)",border:"1px solid rgba(214,64,69,0.1)",borderRadius:10,padding:"0.6rem"}}>
                  <div style={{fontWeight:700,color:"#d64045",fontSize:"0.62rem",marginBottom:"0.25rem"}}>😰 困る人</div>
                  <div style={{color:"#8090a0",lineHeight:1.7,fontSize:"0.62rem"}}>
                    断水後にスーパーへ走る<br/>給水車に数時間並ぶ<br/>トイレが流せずパニック<br/>「行政がなんとかしてくれる」<br/>備蓄水の期限が切れている
                  </div>
                </div>
                <div style={{background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.1)",borderRadius:10,padding:"0.6rem"}}>
                  <div style={{fontWeight:700,color:"#22c55e",fontSize:"0.62rem",marginBottom:"0.25rem"}}>😌 備えている人</div>
                  <div style={{color:"#8090a0",lineHeight:1.7,fontSize:"0.62rem"}}>
                    備蓄で数日は自宅で持つ<br/>ポリタンク+カートで運搬<br/>簡易トイレで水を節約<br/>「自力確保が前提」の思考<br/>浄水器で無限の水源を確保
                  </div>
                </div>
              </div>
            </div>

            <div style={{...S.c,borderColor:"rgba(0,180,216,0.15)"}}>
              <h3 style={{fontSize:"0.76rem",fontWeight:700,color:"#00b4d8",marginBottom:"0.5rem"}}>💡 今日からできるアクション</h3>
              {[
                {w:"今すぐ",a:"2L×6本の水を1箱購入（大人1人2日分）",i:"🛒"},
                {w:"1週間以内",a:`家族${res.fm}人分の備蓄（${res.dy*3}L〜${res.wk}L）を確保`,i:"📦"},
                {w:"1ヶ月以内",a:"浄水器の導入で「水を作れる力」を備える",i:"💧"},
                {w:"併せて",a:"簡易トイレ・ラップ・ウェットティッシュ・カートを準備",i:"🧹"},
              ].map((a,i)=>(
                <div key={i} style={{display:"flex",gap:"0.5rem",alignItems:"flex-start",padding:"0.4rem 0",borderBottom:i<3?"1px solid rgba(200,220,240,0.04)":"none"}}>
                  <span style={{fontSize:"0.9rem",flexShrink:0}}>{a.i}</span>
                  <div><div style={{fontSize:"0.58rem",color:"#00b4d8",fontWeight:700}}>{a.w}</div><div style={{fontSize:"0.75rem",color:"#b8c8d8"}}>{a.a}</div></div>
                </div>
              ))}
            </div>

            <div style={{background:"linear-gradient(135deg,rgba(10,20,36,0.97),rgba(14,30,52,0.97))",border:"1px solid rgba(232,168,56,0.18)",borderRadius:18,padding:"1.2rem",textAlign:"center"}}>
              <div style={{fontSize:"0.52rem",letterSpacing:"3px",color:"#e8a838",fontWeight:700,marginBottom:"0.3rem"}}>SOLUTION</div>
              <h3 style={{fontSize:"0.95rem",fontWeight:900,marginBottom:"0.15rem",lineHeight:1.4}}>
                備蓄の限界を超える<br/>
                <span style={{background:"linear-gradient(135deg,#00b4d8,#90e0ef)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>「水を作れる力」</span>
              </h3>
              <p style={{fontSize:"0.68rem",color:"#5a6a7e",margin:"0.2rem 0 0.7rem"}}>
                AQUA SYSTEM SJ-100 — 電源不要・注ぐだけ<br/>フィルター1本 = 2Lペットボトル約450本分
              </p>
              <div style={{display:"flex",gap:"0.35rem",justifyContent:"center",flexWrap:"wrap",marginBottom:"0.4rem"}}>
                <a href="https://www.amazon.co.jp/dp/B0CKXN6PF9" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.2rem",padding:"0.6rem 1.2rem",background:"linear-gradient(135deg,#ff9900,#e88a00)",color:"#111",fontWeight:700,fontSize:"0.76rem",textDecoration:"none",borderRadius:50}}>🛒 Amazon</a>
                <a href="https://item.rakuten.co.jp/navyfieldsllc/aqua001-pr/" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.2rem",padding:"0.6rem 1.2rem",background:"linear-gradient(135deg,#bf0000,#a00000)",color:"white",fontWeight:700,fontSize:"0.76rem",textDecoration:"none",borderRadius:50}}>🛍️ 楽天</a>
              </div>
              <p style={{fontSize:"0.58rem",color:"#3a4a5e",margin:0}}>
                <span style={{textDecoration:"line-through"}}>¥39,800</span>{" → "}
                <span style={{color:"#e8a838",fontWeight:700,fontSize:"0.72rem"}}>¥24,500</span>（税込・送料無料）
              </p>
            </div>

            <div style={{textAlign:"center",marginTop:"0.7rem",paddingBottom:"1rem"}}>
              <button onClick={restart} style={{background:"none",border:"1px solid #1e2e3e",color:"#4a5a6e",padding:"0.45rem 1.2rem",borderRadius:50,fontSize:"0.68rem",cursor:"pointer",fontFamily:"inherit"}}>もう一度診断する</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes su{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        button:hover{filter:brightness(1.08)}
        *::-webkit-scrollbar{width:3px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:#141e2e;border-radius:2px}
      `}</style>
    </div>
  );
}
