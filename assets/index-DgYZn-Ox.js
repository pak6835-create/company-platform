import{j as e,a as Z}from"./index-CVU1Nt4s.js";import{a as x,f as ee}from"./vendor-react-BLQjSpGA.js";const V=[{value:"hunter",label:"헌터물"},{value:"fantasy",label:"판타지"},{value:"romance",label:"로맨스"},{value:"action",label:"액션"},{value:"thriller",label:"스릴러"},{value:"sf",label:"SF"},{value:"horror",label:"호러"},{value:"comedy",label:"코미디"},{value:"drama",label:"드라마"},{value:"slice_of_life",label:"일상물"}],W=[{value:"dark",label:"어두운"},{value:"bright",label:"밝은"},{value:"serious",label:"진지한"},{value:"light",label:"가벼운"},{value:"mysterious",label:"미스터리"},{value:"tense",label:"긴장감"}],ae={hunter:["회귀","복수","성장","던전","각성","길드","랭커"],fantasy:["마법","용사","마왕","이세계","기사","정령","드래곤"],romance:["재회","연상연하","오피스","친구에서연인","짝사랑","계약연애"],action:["복수","격투","추격","조직","암살","생존"],thriller:["연쇄살인","미궁","심리전","복수","반전","음모"],sf:["AI","우주","로봇","타임슬립","디스토피아","가상현실"],horror:["귀신","저주","폐가","실종","악몽","괴물"],comedy:["개그","반전","오해","슬랩스틱","패러디"],drama:["가족","성장","우정","갈등","화해","비밀"],slice_of_life:["일상","힐링","성장","우정","취미","직장"]};function se({project:n,updateProject:u,apiKey:d,setApiKey:_,onNext:y}){const[j,g]=x.useState(""),[h,b]=x.useState(!1),S=s=>{s&&!n.keywords.includes(s)&&u({keywords:[...n.keywords,s]}),g("")},C=s=>{u({keywords:n.keywords.filter(N=>N!==s)})},i=async()=>{var w,P,G,z,R,E,D;if(!d){alert("Gemini API 키를 입력해주세요.");return}if(!n.genre){alert("장르를 선택해주세요.");return}b(!0);const s=((w=V.find(l=>l.value===n.genre))==null?void 0:w.label)||n.genre,N=((P=W.find(l=>l.value===n.mood))==null?void 0:P.label)||n.mood||"자유",L=`
당신은 웹툰/웹소설 세계관 전문가입니다.
다음 설정으로 웹툰 세계관과 플롯을 만들어주세요.

장르: ${s}
키워드: ${n.keywords.join(", ")||"없음"}
분위기: ${N}

다음 형식의 JSON으로만 응답해주세요 (다른 텍스트 없이):
{
  "worldSetting": {
    "description": "세계관 설명 (200자 내외)",
    "rules": ["규칙1", "규칙2", "규칙3"],
    "timeline": "시대 배경"
  },
  "plot": {
    "act1": "1막 요약 (도입부, 1-30화)",
    "act2": "2막 요약 (전개부, 31-70화)",
    "act3": "3막 요약 (결말부, 71-100화)"
  }
}
`;try{const a=await(await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:L}]}],generationConfig:{temperature:.8,maxOutputTokens:2048}})})).json();if(a.error)throw new Error(a.error.message||"API 오류");const t=(D=(E=(R=(z=(G=a.candidates)==null?void 0:G[0])==null?void 0:z.content)==null?void 0:R.parts)==null?void 0:E[0])==null?void 0:D.text;if(t){const r=t.match(/\{[\s\S]*\}/);if(r){const c=JSON.parse(r[0]);u({worldSetting:c.worldSetting,plot:c.plot})}}}catch(l){console.error("설정 생성 실패:",l),alert(`설정 생성 실패: ${l instanceof Error?l.message:"알 수 없는 오류"}`)}finally{b(!1)}},p=ae[n.genre]||[],k=n.worldSetting&&n.plot;return e.jsxs("div",{className:"setting-tab",children:[e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"🔑"}),e.jsx("h2",{children:"Gemini API 설정"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"API 키 (모든 기능에서 공유됨)"}),e.jsx("input",{type:"password",className:"form-input",value:d,onChange:s=>_(s.target.value),placeholder:"Gemini API 키를 입력하세요"}),e.jsxs("p",{className:"form-hint",children:[e.jsx("a",{href:"https://aistudio.google.com/apikey",target:"_blank",rel:"noopener noreferrer",children:"Google AI Studio"}),"에서 API 키를 발급받을 수 있습니다. 한번 입력하면 저장됩니다."]})]})]}),e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"🎬"}),e.jsx("h2",{children:"스토리 설정"})]}),e.jsxs("div",{className:"setting-grid",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"장르 *"}),e.jsxs("select",{className:"form-select",value:n.genre,onChange:s=>u({genre:s.target.value}),children:[e.jsx("option",{value:"",children:"장르 선택..."}),V.map(s=>e.jsx("option",{value:s.value,children:s.label},s.value))]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"분위기"}),e.jsxs("select",{className:"form-select",value:n.mood,onChange:s=>u({mood:s.target.value}),children:[e.jsx("option",{value:"",children:"분위기 선택..."}),W.map(s=>e.jsx("option",{value:s.value,children:s.label},s.value))]})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"키워드"}),e.jsxs("div",{className:"keyword-input-row",children:[e.jsx("input",{type:"text",className:"form-input",value:j,onChange:s=>g(s.target.value),onKeyDown:s=>s.key==="Enter"&&S(j),placeholder:"키워드 입력 후 Enter"}),e.jsx("button",{className:"btn-secondary",onClick:()=>S(j),children:"추가"})]}),n.keywords.length>0&&e.jsx("div",{className:"keyword-tags",children:n.keywords.map(s=>e.jsxs("span",{className:"keyword-tag",children:[s,e.jsx("button",{onClick:()=>C(s),children:"×"})]},s))}),p.length>0&&e.jsxs("div",{className:"keyword-suggestions",children:[e.jsx("span",{className:"suggestion-label",children:"추천:"}),p.filter(s=>!n.keywords.includes(s)).map(s=>e.jsxs("button",{className:"suggestion-btn",onClick:()=>S(s),children:["+ ",s]},s))]})]}),e.jsx("button",{className:"btn-primary generate-btn",onClick:i,disabled:h||!d||!n.genre,children:h?"⏳ 생성 중...":"🚀 세계관 & 플롯 생성"})]}),n.worldSetting&&e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"📖"}),e.jsx("h2",{children:"생성된 세계관"})]}),e.jsxs("div",{className:"generated-content",children:[e.jsxs("div",{className:"content-block",children:[e.jsx("h3",{children:"배경 설명"}),e.jsx("p",{children:n.worldSetting.description})]}),e.jsxs("div",{className:"content-block",children:[e.jsx("h3",{children:"세계 규칙"}),e.jsx("ul",{children:n.worldSetting.rules.map((s,N)=>e.jsx("li",{children:s},N))})]}),e.jsxs("div",{className:"content-block",children:[e.jsx("h3",{children:"시대 배경"}),e.jsx("p",{children:n.worldSetting.timeline})]})]})]}),n.plot&&e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"📊"}),e.jsx("h2",{children:"생성된 플롯"})]}),e.jsxs("div",{className:"plot-timeline",children:[e.jsxs("div",{className:"plot-act",children:[e.jsx("div",{className:"act-number",children:"1막"}),e.jsx("div",{className:"act-title",children:"도입부"}),e.jsx("p",{children:n.plot.act1})]}),e.jsx("div",{className:"plot-connector",children:"→"}),e.jsxs("div",{className:"plot-act",children:[e.jsx("div",{className:"act-number",children:"2막"}),e.jsx("div",{className:"act-title",children:"전개부"}),e.jsx("p",{children:n.plot.act2})]}),e.jsx("div",{className:"plot-connector",children:"→"}),e.jsxs("div",{className:"plot-act",children:[e.jsx("div",{className:"act-number",children:"3막"}),e.jsx("div",{className:"act-title",children:"결말부"}),e.jsx("p",{children:n.plot.act3})]})]})]}),k&&e.jsx("div",{className:"next-step",children:e.jsx("button",{className:"btn-primary",onClick:y,children:"다음 단계: 캐릭터 생성 →"})}),e.jsx("style",{children:`
        .setting-tab {
          max-width: 800px;
          margin: 0 auto;
        }

        .setting-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .keyword-input-row {
          display: flex;
          gap: 8px;
        }

        .keyword-input-row .form-input {
          flex: 1;
        }

        .keyword-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .keyword-tag {
          background: rgba(124, 58, 237, 0.2);
          color: #a855f7;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .keyword-tag button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 0;
          font-size: 16px;
          line-height: 1;
        }

        .keyword-suggestions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .suggestion-label {
          font-size: 12px;
          color: #64748b;
        }

        .suggestion-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-btn:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: #7c3aed;
          color: #a855f7;
        }

        .generate-btn {
          width: 100%;
          margin-top: 16px;
        }

        .form-hint {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
        }

        .form-hint a {
          color: #7c3aed;
        }

        .generated-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .content-block h3 {
          font-size: 14px;
          font-weight: 600;
          color: #a855f7;
          margin: 0 0 8px 0;
        }

        .content-block p {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          margin: 0;
        }

        .content-block ul {
          margin: 0;
          padding-left: 20px;
        }

        .content-block li {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.8;
        }

        .plot-timeline {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .plot-act {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 16px;
        }

        .act-number {
          font-size: 12px;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 4px;
        }

        .act-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8px;
        }

        .plot-act p {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        .plot-connector {
          color: #64748b;
          font-size: 20px;
          padding-top: 32px;
        }

        .next-step {
          margin-top: 24px;
          text-align: center;
        }

        .next-step .btn-primary {
          padding: 16px 32px;
          font-size: 16px;
        }

        @media (max-width: 640px) {
          .setting-grid {
            grid-template-columns: 1fr;
          }

          .plot-timeline {
            flex-direction: column;
          }

          .plot-connector {
            transform: rotate(90deg);
            padding: 0;
            text-align: center;
          }
        }
      `})]})}const te=["주인공","조력자","악역","서브주인공","멘토","라이벌"],ne=()=>({id:`char-${Date.now()}`,name:"새 캐릭터",role:"주인공",age:"",goal:"",secret:"",appearance:"",backstory:"",personality:{introvert_extrovert:50,emotional_rational:50,timid_bold:50,selfish_altruistic:50,serious_humorous:50},speechStyle:{formal_casual:50,quiet_talkative:50,habits:[],examples:[]},relationships:{}}),ie=[{key:"introvert_extrovert",left:"내향적",right:"외향적"},{key:"emotional_rational",left:"감정적",right:"이성적"},{key:"timid_bold",left:"소심함",right:"대담함"},{key:"selfish_altruistic",left:"이기적",right:"이타적"},{key:"serious_humorous",left:"진지함",right:"유머러스"}],re=[{key:"formal_casual",left:"존댓말",right:"반말"},{key:"quiet_talkative",left:"말 적음",right:"말 많음"}],le=["혼잣말 많이 함","욕 섞어서 말함",'끝에 "...했지" 붙임',"질문으로 대답함","짧게 끊어서 말함","감탄사 많이 씀","비꼬는 말투","장황하게 설명함"];function oe({project:n,updateProject:u,apiKey:d,onNext:_}){const[y,j]=x.useState(null),[g,h]=x.useState("basic"),[b,S]=x.useState(""),[C,i]=x.useState(!1),[p,k]=x.useState(3),s=n.characters.find(a=>a.id===y),N=async()=>{var t,r,c,m,f,I,T,O;if(!d){alert("설정 탭에서 Gemini API 키를 먼저 입력해주세요.");return}if(!n.worldSetting){alert("먼저 설정 탭에서 세계관을 생성해주세요.");return}i(!0);const a=`
당신은 웹툰/웹소설 캐릭터 전문가입니다.
다음 세계관에 맞는 캐릭터 ${p}명을 만들어주세요.

[세계관]
${n.worldSetting.description}
규칙: ${n.worldSetting.rules.join(", ")}
시대: ${n.worldSetting.timeline}

[플롯]
1막: ${((t=n.plot)==null?void 0:t.act1)||""}
2막: ${((r=n.plot)==null?void 0:r.act2)||""}
3막: ${((c=n.plot)==null?void 0:c.act3)||""}

[요구사항]
- 주인공 1명, 조력자 1명, 악역 1명 포함 (${p}명 중에서)
- 각 캐릭터는 서로 다른 성격과 말투를 가짐
- 캐릭터 간의 관계도 설정

다음 형식의 JSON으로만 응답해주세요:
{
  "characters": [
    {
      "name": "캐릭터 이름",
      "role": "역할 (주인공/조력자/악역/서브주인공/멘토/라이벌)",
      "age": "나이",
      "goal": "목표",
      "secret": "비밀",
      "appearance": "외모 묘사 (1-2문장)",
      "backstory": "배경 이야기 (2-3문장)",
      "personality": {
        "introvert_extrovert": 0-100,
        "emotional_rational": 0-100,
        "timid_bold": 0-100,
        "selfish_altruistic": 0-100,
        "serious_humorous": 0-100
      },
      "speechStyle": {
        "formal_casual": 0-100,
        "quiet_talkative": 0-100,
        "habits": ["습관1", "습관2"],
        "examples": ["예시 대사1", "예시 대사2"]
      }
    }
  ]
}
`;try{const M=await(await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.9,maxOutputTokens:4096}})})).json();if(M.error)throw new Error(M.error.message||"API 오류");const A=(O=(T=(I=(f=(m=M.candidates)==null?void 0:m[0])==null?void 0:f.content)==null?void 0:I.parts)==null?void 0:T[0])==null?void 0:O.text;if(A){const v=A.match(/\{[\s\S]*\}/);if(v){const J=JSON.parse(v[0]);if(J.characters&&Array.isArray(J.characters)){const q=J.characters.map(($,B)=>({id:`char-${Date.now()}-${B}`,name:$.name||"이름 없음",role:$.role||"주인공",age:$.age||"",goal:$.goal||"",secret:$.secret||"",appearance:$.appearance||"",backstory:$.backstory||"",personality:$.personality||{introvert_extrovert:50,emotional_rational:50,timid_bold:50,selfish_altruistic:50,serious_humorous:50},speechStyle:$.speechStyle||{formal_casual:50,quiet_talkative:50,habits:[],examples:[]},relationships:{}}));u({characters:[...n.characters,...q]}),q.length>0&&j(q[0].id)}}}}catch(o){console.error("캐릭터 생성 실패:",o),alert(`캐릭터 생성 실패: ${o instanceof Error?o.message:"알 수 없는 오류"}`)}finally{i(!1)}},L=()=>{const a=ne();u({characters:[...n.characters,a]}),j(a.id)},w=(a,t)=>{u({characters:n.characters.map(r=>r.id===a?{...r,...t}:r)})},P=a=>{confirm("이 캐릭터를 삭제하시겠습니까?")&&(u({characters:n.characters.filter(t=>t.id!==a)}),y===a&&j(null))},G=(a,t)=>{s&&w(s.id,{personality:{...s.personality,[a]:t}})},z=(a,t)=>{s&&w(s.id,{speechStyle:{...s.speechStyle,[a]:t}})},R=a=>{if(!s)return;const t=s.speechStyle.habits.includes(a)?s.speechStyle.habits.filter(r=>r!==a):[...s.speechStyle.habits,a];z("habits",t)},E=()=>{!s||!b.trim()||(z("examples",[...s.speechStyle.examples,b.trim()]),S(""))},D=a=>{s&&z("examples",s.speechStyle.examples.filter((t,r)=>r!==a))},l=n.characters.length>=2;return e.jsxs("div",{className:"character-tab",children:[e.jsxs("div",{className:"section ai-generate-section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"🤖"}),e.jsx("h2",{children:"AI 캐릭터 자동 생성"})]}),e.jsx("p",{className:"section-desc",children:"세계관에 맞는 캐릭터를 AI가 자동으로 생성합니다."}),e.jsxs("div",{className:"generate-controls",children:[e.jsxs("div",{className:"char-count-control",children:[e.jsx("label",{children:"생성할 캐릭터 수:"}),e.jsxs("select",{value:p,onChange:a=>k(Number(a.target.value)),className:"form-select small",children:[e.jsx("option",{value:2,children:"2명"}),e.jsx("option",{value:3,children:"3명"}),e.jsx("option",{value:4,children:"4명"}),e.jsx("option",{value:5,children:"5명"})]})]}),e.jsx("button",{className:"btn-primary",onClick:N,disabled:C||!n.worldSetting,children:C?"⏳ 생성 중...":"🎭 캐릭터 자동 생성"})]}),!n.worldSetting&&e.jsx("p",{className:"warning-text",children:"⚠️ 먼저 설정 탭에서 세계관을 생성해주세요."})]}),e.jsxs("div",{className:"character-layout",children:[e.jsxs("div",{className:"character-list-section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"👥"}),e.jsxs("h2",{children:["캐릭터 목록 (",n.characters.length,")"]})]}),e.jsxs("div",{className:"character-list",children:[n.characters.map(a=>e.jsxs("div",{className:`character-card ${y===a.id?"selected":""}`,onClick:()=>j(a.id),children:[e.jsx("div",{className:"char-avatar",children:a.name.charAt(0)}),e.jsxs("div",{className:"char-info",children:[e.jsx("div",{className:"char-name",children:a.name}),e.jsx("div",{className:"char-role",children:a.role})]}),e.jsx("button",{className:"delete-btn",onClick:t=>{t.stopPropagation(),P(a.id)},children:"×"})]},a.id)),e.jsxs("button",{className:"add-character-btn",onClick:L,children:[e.jsx("span",{children:"+"}),e.jsx("span",{children:"수동으로 추가"})]})]})]}),s?e.jsxs("div",{className:"character-editor-section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"✏️"}),e.jsxs("h2",{children:["캐릭터 편집: ",s.name]})]}),e.jsx("div",{className:"edit-tabs",children:[{id:"basic",label:"기본정보"},{id:"personality",label:"성격"},{id:"speech",label:"말투"},{id:"relationship",label:"관계"}].map(a=>e.jsx("button",{className:`edit-tab ${g===a.id?"active":""}`,onClick:()=>h(a.id),children:a.label},a.id))}),g==="basic"&&e.jsxs("div",{className:"edit-content",children:[e.jsxs("div",{className:"form-row",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"이름"}),e.jsx("input",{type:"text",className:"form-input",value:s.name,onChange:a=>w(s.id,{name:a.target.value})})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"역할"}),e.jsx("select",{className:"form-select",value:s.role,onChange:a=>w(s.id,{role:a.target.value}),children:te.map(a=>e.jsx("option",{value:a,children:a},a))})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"나이"}),e.jsx("input",{type:"text",className:"form-input",value:s.age,onChange:a=>w(s.id,{age:a.target.value}),placeholder:"예: 25세, 32→22세 (회귀)"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"외모"}),e.jsx("textarea",{className:"form-textarea",value:s.appearance||"",onChange:a=>w(s.id,{appearance:a.target.value}),placeholder:"캐릭터의 외모를 묘사해주세요",rows:2})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"배경 이야기"}),e.jsx("textarea",{className:"form-textarea",value:s.backstory||"",onChange:a=>w(s.id,{backstory:a.target.value}),placeholder:"캐릭터의 과거와 배경을 적어주세요",rows:3})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"목표"}),e.jsx("input",{type:"text",className:"form-input",value:s.goal,onChange:a=>w(s.id,{goal:a.target.value}),placeholder:"캐릭터가 달성하고자 하는 것"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"비밀"}),e.jsx("input",{type:"text",className:"form-input",value:s.secret,onChange:a=>w(s.id,{secret:a.target.value}),placeholder:"다른 캐릭터가 모르는 것"})]})]}),g==="personality"&&e.jsxs("div",{className:"edit-content",children:[e.jsx("p",{className:"tab-description",children:"슬라이더를 조절하여 캐릭터의 성격을 설정하세요."}),ie.map(a=>e.jsxs("div",{className:"slider-group",children:[e.jsxs("div",{className:"slider-labels",children:[e.jsx("span",{children:a.left}),e.jsxs("span",{className:"slider-value",children:[s.personality[a.key],"%"]}),e.jsx("span",{children:a.right})]}),e.jsx("input",{type:"range",min:"0",max:"100",value:s.personality[a.key],onChange:t=>G(a.key,Number(t.target.value)),className:"slider"})]},a.key))]}),g==="speech"&&e.jsxs("div",{className:"edit-content",children:[re.map(a=>e.jsxs("div",{className:"slider-group",children:[e.jsxs("div",{className:"slider-labels",children:[e.jsx("span",{children:a.left}),e.jsxs("span",{className:"slider-value",children:[s.speechStyle[a.key],"%"]}),e.jsx("span",{children:a.right})]}),e.jsx("input",{type:"range",min:"0",max:"100",value:s.speechStyle[a.key],onChange:t=>z(a.key,Number(t.target.value)),className:"slider"})]},a.key)),e.jsxs("div",{className:"form-group",style:{marginTop:24},children:[e.jsx("label",{children:"버릇/습관"}),e.jsx("div",{className:"habit-options",children:le.map(a=>e.jsxs("label",{className:"habit-checkbox",children:[e.jsx("input",{type:"checkbox",checked:s.speechStyle.habits.includes(a),onChange:()=>R(a)}),e.jsx("span",{children:a})]},a))})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"예시 대사"}),e.jsxs("div",{className:"example-input-row",children:[e.jsx("input",{type:"text",className:"form-input",value:b,onChange:a=>S(a.target.value),onKeyDown:a=>a.key==="Enter"&&E(),placeholder:"예시 대사 입력 후 Enter"}),e.jsx("button",{className:"btn-secondary",onClick:E,children:"추가"})]}),s.speechStyle.examples.length>0&&e.jsx("div",{className:"example-list",children:s.speechStyle.examples.map((a,t)=>e.jsxs("div",{className:"example-item",children:[e.jsxs("span",{children:['"',a,'"']}),e.jsx("button",{onClick:()=>D(t),children:"×"})]},t))})]})]}),g==="relationship"&&e.jsxs("div",{className:"edit-content",children:[e.jsx("p",{className:"tab-description",children:"다른 캐릭터와의 관계를 설정하세요."}),n.characters.filter(a=>a.id!==s.id).map(a=>{var t;return e.jsxs("div",{className:"relationship-item",children:[e.jsxs("div",{className:"rel-char",children:[e.jsx("div",{className:"char-avatar small",children:a.name.charAt(0)}),e.jsx("span",{children:a.name})]}),e.jsxs("select",{className:"form-select small",value:((t=s.relationships[a.id])==null?void 0:t.type)||"",onChange:r=>{const c={...s.relationships};r.target.value?c[a.id]={type:r.target.value,level:50}:delete c[a.id],w(s.id,{relationships:c})},children:[e.jsx("option",{value:"",children:"관계 선택..."}),e.jsx("option",{value:"친구",children:"친구"}),e.jsx("option",{value:"적",children:"적"}),e.jsx("option",{value:"연인",children:"연인"}),e.jsx("option",{value:"가족",children:"가족"}),e.jsx("option",{value:"라이벌",children:"라이벌"}),e.jsx("option",{value:"스승",children:"스승"}),e.jsx("option",{value:"동료",children:"동료"})]})]},a.id)}),n.characters.length<2&&e.jsx("p",{className:"empty-message",children:"다른 캐릭터를 추가하면 관계를 설정할 수 있습니다."})]})]}):e.jsx("div",{className:"no-selection",children:e.jsx("p",{children:"왼쪽에서 캐릭터를 선택하거나 AI로 자동 생성하세요."})})]}),l&&e.jsx("div",{className:"next-step",children:e.jsx("button",{className:"btn-primary",onClick:_,children:"다음 단계: 시뮬레이션 →"})}),e.jsx("style",{children:`
        .character-tab {
          height: 100%;
        }

        .ai-generate-section {
          max-width: 100%;
          margin-bottom: 24px;
        }

        .section-desc {
          font-size: 14px;
          color: #94a3b8;
          margin: 0 0 16px 0;
        }

        .generate-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .char-count-control {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 14px;
        }

        .char-count-control .form-select {
          width: auto;
        }

        .warning-text {
          color: #f59e0b;
          font-size: 13px;
          margin-top: 12px;
        }

        .character-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          height: calc(100vh - 360px);
        }

        .character-list-section,
        .character-editor-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          overflow-y: auto;
        }

        .character-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .character-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .character-card:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .character-card.selected {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.3);
        }

        .char-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .char-avatar.small {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }

        .char-info {
          flex: 1;
        }

        .char-name {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
        }

        .char-role {
          font-size: 12px;
          color: #64748b;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .character-card:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: #ef4444;
        }

        .add-character-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: transparent;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-character-btn:hover {
          border-color: #7c3aed;
          color: #a855f7;
        }

        .edit-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .edit-tab {
          background: transparent;
          border: none;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-tab:hover {
          color: #94a3b8;
        }

        .edit-tab.active {
          background: rgba(124, 58, 237, 0.2);
          color: #a855f7;
        }

        .edit-content {
          padding: 8px 0;
        }

        .tab-description {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          min-height: 60px;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #7c3aed;
        }

        .slider-group {
          margin-bottom: 20px;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          color: #94a3b8;
        }

        .slider-value {
          color: #a855f7;
          font-weight: 500;
        }

        .slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: #7c3aed;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .habit-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .habit-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
        }

        .habit-checkbox input {
          accent-color: #7c3aed;
        }

        .example-input-row {
          display: flex;
          gap: 8px;
        }

        .example-input-row .form-input {
          flex: 1;
        }

        .example-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .example-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-size: 13px;
          color: #cbd5e1;
        }

        .example-item button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
        }

        .example-item button:hover {
          color: #ef4444;
        }

        .relationship-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .rel-char {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          font-size: 14px;
        }

        .form-select.small {
          width: 140px;
          padding: 6px 10px;
          font-size: 13px;
        }

        .no-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 40px;
        }

        .no-selection p {
          color: #64748b;
          font-size: 14px;
        }

        .empty-message {
          color: #64748b;
          font-size: 13px;
          text-align: center;
          padding: 20px;
        }

        .next-step {
          margin-top: 24px;
          text-align: center;
        }

        .next-step .btn-primary {
          padding: 16px 32px;
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .character-layout {
            grid-template-columns: 1fr;
          }
        }
      `})]})}function ce({project:n,updateProject:u,apiKey:d,onNext:_}){var l;const[y,j]=x.useState(null),[g,h]=x.useState(!1),[b,S]=x.useState(0),C=x.useRef(!1),[i,p]=x.useState({location:"",time:"낮",situation:"",participants:[],events:[],endCondition:""}),[k,s]=x.useState(10),[N,L]=x.useState([]);n.episodes.find(a=>a.id===y);const w=()=>{const a={id:`ep-${Date.now()}`,number:n.episodes.length+1,title:`${n.episodes.length+1}화`,scenes:[]};u({episodes:[...n.episodes,a]}),j(a.id)},P=a=>{const t=i.participants||[];t.includes(a)?p({...i,participants:t.filter(r=>r!==a)}):p({...i,participants:[...t,a]})},G=a=>{const t=i.events||[];t.includes(a)?p({...i,events:t.filter(r=>r!==a)}):p({...i,events:[...t,a]})},z=a=>{const t=n.characters.find(m=>m.id===a);if(!t)return"";const r=[];t.personality.introvert_extrovert<40?r.push("내향적"):t.personality.introvert_extrovert>60&&r.push("외향적"),t.personality.emotional_rational<40?r.push("감정적"):t.personality.emotional_rational>60&&r.push("이성적"),t.personality.timid_bold>60&&r.push("대담함"),t.personality.serious_humorous>60&&r.push("유머러스");const c=[];return t.speechStyle.formal_casual<40?c.push("존댓말 사용"):t.speechStyle.formal_casual>60&&c.push("반말 사용"),t.speechStyle.quiet_talkative<40?c.push("말이 적음"):t.speechStyle.quiet_talkative>60&&c.push("말이 많음"),`
캐릭터: ${t.name} (${t.role})
나이: ${t.age}
목표: ${t.goal}
비밀: ${t.secret}
성격: ${r.join(", ")||"보통"}
말투: ${c.join(", ")||"보통"}, ${t.speechStyle.habits.join(", ")||"특별한 습관 없음"}
예시 대사: ${t.speechStyle.examples.join(" / ")||"없음"}
`},R=async()=>{var m,f,I,T,O,o,M,A;if(!d){alert("설정 탭에서 Gemini API 키를 먼저 입력해주세요.");return}if((((m=i.participants)==null?void 0:m.length)||0)<2){alert("참여 캐릭터를 2명 이상 선택해주세요.");return}h(!0),L([]),S(0),C.current=!1;const a=i.participants||[],t=[];let r="";const c=`
[세계관]
${((f=n.worldSetting)==null?void 0:f.description)||""}

[현재 씬]
장소: ${i.location||"어딘가"}
시간: ${i.time||"낮"}
상황: ${i.situation||"일상적인 상황"}
예정된 이벤트: ${((I=i.events)==null?void 0:I.join(", "))||"없음"}

[참여 캐릭터]
${a.map(v=>z(v)).join(`
`)}
`;for(let v=0;v<k&&!C.current;v++){const J=v%a.length,q=a[J],$=n.characters.find(Y=>Y.id===q);if(!$)continue;S(v+1);const B=`
${c}

[이전 대화]
${r||"(아직 대화 없음 - 첫 대화를 시작하세요)"}

[지시사항]
당신은 "${$.name}" 캐릭터입니다.
위 캐릭터 설정에 맞게 다음 대화를 해주세요.
반드시 캐릭터의 성격과 말투를 유지하세요.

다음 형식의 JSON으로만 응답하세요:
{
  "dialogue": "캐릭터의 대사",
  "action": "캐릭터의 행동 묘사 (괄호 없이)",
  "emotion": "현재 감정 (한 단어)"
}
`;try{const K=await(await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:B}]}],generationConfig:{temperature:.9,maxOutputTokens:500}})})).json();if(K.error)throw new Error(K.error.message);const F=(A=(M=(o=(O=(T=K.candidates)==null?void 0:T[0])==null?void 0:O.content)==null?void 0:o.parts)==null?void 0:M[0])==null?void 0:A.text;if(F){const H=F.match(/\{[\s\S]*\}/);if(H){const U=JSON.parse(H[0]),X={characterId:q,characterName:$.name,dialogue:U.dialogue||"",action:U.action||"",emotion:U.emotion||"중립"};t.push(X),L([...t]),r+=`
${$.name}: "${U.dialogue}" (${U.action})`}}await new Promise(H=>setTimeout(H,500))}catch(Y){console.error("시뮬레이션 턴 실패:",Y);break}}y&&t.length>0&&u({episodes:n.episodes.map(v=>v.id===y?{...v,simulation:{turns:t,status:"completed"}}:v)}),h(!1)},E=()=>{C.current=!0,h(!1)},D=n.episodes.some(a=>{var t;return((t=a.simulation)==null?void 0:t.status)==="completed"});return e.jsxs("div",{className:"simulation-tab",children:[e.jsxs("div",{className:"sim-layout",children:[e.jsxs("div",{className:"sim-setup-panel",children:[e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"📺"}),e.jsx("h2",{children:"에피소드"})]}),e.jsxs("div",{className:"episode-list",children:[n.episodes.map(a=>{var t;return e.jsxs("button",{className:`episode-btn ${y===a.id?"active":""}`,onClick:()=>j(a.id),children:[a.title,((t=a.simulation)==null?void 0:t.status)==="completed"&&e.jsx("span",{className:"done-badge",children:"✓"})]},a.id)}),e.jsx("button",{className:"add-episode-btn",onClick:w,children:"+ 에피소드 추가"})]})]}),e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"🎬"}),e.jsx("h2",{children:"씬 설정"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"장소"}),e.jsx("input",{type:"text",className:"form-input",value:i.location,onChange:a=>p({...i,location:a.target.value}),placeholder:"예: 던전 입구, 카페"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"시간"}),e.jsxs("select",{className:"form-select",value:i.time,onChange:a=>p({...i,time:a.target.value}),children:[e.jsx("option",{value:"아침",children:"아침"}),e.jsx("option",{value:"낮",children:"낮"}),e.jsx("option",{value:"저녁",children:"저녁"}),e.jsx("option",{value:"밤",children:"밤"}),e.jsx("option",{value:"새벽",children:"새벽"})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"상황"}),e.jsx("input",{type:"text",className:"form-input",value:i.situation,onChange:a=>p({...i,situation:a.target.value}),placeholder:"예: 주인공 첫 각성, 우연한 만남"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"참여 캐릭터 (2명 이상 선택)"}),n.characters.length>0?e.jsx("div",{className:"participant-list",children:n.characters.map(a=>{var t;return e.jsxs("label",{className:"participant-checkbox",children:[e.jsx("input",{type:"checkbox",checked:(t=i.participants)==null?void 0:t.includes(a.id),onChange:()=>P(a.id)}),e.jsxs("span",{children:[a.name," (",a.role,")"]})]},a.id)})}):e.jsx("p",{className:"empty-hint",children:"먼저 캐릭터를 추가해주세요."})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"이벤트 트리거"}),e.jsx("div",{className:"event-options",children:["중간에 제3자 등장","몬스터 출현","위험 상황 발생","비밀 폭로","갈등 발생"].map(a=>{var t;return e.jsxs("label",{className:"event-checkbox",children:[e.jsx("input",{type:"checkbox",checked:(t=i.events)==null?void 0:t.includes(a),onChange:()=>G(a)}),e.jsx("span",{children:a})]},a)})})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{children:"대화 턴 수"}),e.jsxs("select",{className:"form-select",value:k,onChange:a=>s(Number(a.target.value)),children:[e.jsx("option",{value:5,children:"5턴"}),e.jsx("option",{value:10,children:"10턴"}),e.jsx("option",{value:15,children:"15턴"}),e.jsx("option",{value:20,children:"20턴"})]})]}),e.jsx("button",{className:"btn-primary start-btn",onClick:R,disabled:g||n.characters.length<2||(((l=i.participants)==null?void 0:l.length)||0)<2,children:g?`⏳ 진행 중... (${b}/${k})`:"▶ 시뮬레이션 시작"}),n.characters.length<2&&e.jsx("p",{className:"warning-text",children:"⚠️ 캐릭터가 2명 이상 필요합니다."})]})]}),e.jsx("div",{className:"sim-result-panel",children:e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"💬"}),e.jsxs("h2",{children:["시뮬레이션 ",g?`진행 중... (${b}/${k})`:"결과"]}),g&&e.jsx("button",{className:"stop-btn",onClick:E,children:"⏹ 중지"})]}),e.jsx("div",{className:"dialogue-container",children:N.length===0?e.jsx("div",{className:"empty-result",children:e.jsx("p",{children:"시뮬레이션을 시작하면 캐릭터들의 대화가 여기에 표시됩니다."})}):N.map((a,t)=>{const r=n.characters.find(m=>m.id===a.characterId),c=(r==null?void 0:r.role)==="주인공"?"#3b82f6":(r==null?void 0:r.role)==="악역"?"#ef4444":(r==null?void 0:r.role)==="조력자"?"#10b981":"#7c3aed";return e.jsxs("div",{className:"dialogue-turn",children:[e.jsx("div",{className:"turn-avatar",style:{background:c},children:(r==null?void 0:r.name.charAt(0))||"?"}),e.jsxs("div",{className:"turn-content",children:[e.jsxs("div",{className:"turn-header",children:[e.jsx("span",{className:"turn-name",children:a.characterName}),e.jsx("span",{className:"turn-emotion",children:a.emotion})]}),e.jsxs("p",{className:"turn-dialogue",children:['"',a.dialogue,'"']}),a.action&&e.jsxs("p",{className:"turn-action",children:["(",a.action,")"]})]})]},t)})})]})})]}),D&&e.jsx("div",{className:"next-step",children:e.jsx("button",{className:"btn-primary",onClick:_,children:"다음 단계: 결과 확인 →"})}),e.jsx("style",{children:`
        .simulation-tab {
          height: 100%;
        }

        .sim-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          height: calc(100vh - 240px);
        }

        .sim-setup-panel {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sim-result-panel {
          overflow-y: auto;
        }

        .sim-result-panel .section {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .episode-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .episode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .episode-btn:hover,
        .episode-btn.active {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.4);
          color: #a855f7;
        }

        .done-badge {
          color: #10b981;
          font-weight: bold;
        }

        .add-episode-btn {
          background: transparent;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .add-episode-btn:hover {
          border-color: #7c3aed;
          color: #a855f7;
        }

        .participant-list,
        .event-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .participant-checkbox,
        .event-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
        }

        .participant-checkbox input,
        .event-checkbox input {
          accent-color: #7c3aed;
        }

        .empty-hint {
          font-size: 13px;
          color: #64748b;
        }

        .start-btn {
          width: 100%;
          margin-top: 8px;
        }

        .warning-text {
          color: #f59e0b;
          font-size: 12px;
          margin-top: 8px;
        }

        .dialogue-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .empty-result {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #64748b;
          font-size: 14px;
          text-align: center;
        }

        .dialogue-turn {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          margin-bottom: 12px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .turn-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
        }

        .turn-content {
          flex: 1;
        }

        .turn-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .turn-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .turn-emotion {
          font-size: 11px;
          color: #64748b;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .turn-dialogue {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          margin: 0;
        }

        .turn-action {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
          margin: 4px 0 0 0;
        }

        .section-header .stop-btn {
          margin-left: auto;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .next-step {
          margin-top: 24px;
          text-align: center;
        }

        .next-step .btn-primary {
          padding: 16px 32px;
          font-size: 16px;
        }

        @media (max-width: 900px) {
          .sim-layout {
            grid-template-columns: 1fr;
          }
        }
      `})]})}function de({project:n,updateProject:u,apiKey:d}){var w,P,G,z,R,E,D;const[_,y]=x.useState(((w=n.episodes[0])==null?void 0:w.id)||null),[j,g]=x.useState("summary"),[h,b]=x.useState(!1),[S,C]=x.useState(null),i=n.episodes.find(l=>l.id===_),p=(l,a)=>{const t=n.episodes.map(r=>{var c,m,f;return r.id===l?{...r,result:{summary:((c=r.result)==null?void 0:c.summary)||"",dialogue:((m=r.result)==null?void 0:m.dialogue)||[],storyboard:((f=r.result)==null?void 0:f.storyboard)||[],...a}}:r});u({episodes:t})},k=async()=>{var r,c,m,f,I,T,O;if(!d||!((r=i==null?void 0:i.simulation)!=null&&r.turns))return;b(!0),C("summary");const a=i.simulation.turns.map(o=>`${o.characterName}: "${o.dialogue}" ${o.action?`(${o.action})`:""}`).join(`
`),t=`
당신은 웹툰/웹소설 요약 전문가입니다.
다음 캐릭터 대화를 바탕으로 에피소드 요약을 작성해주세요.

[세계관]
${((c=n.worldSetting)==null?void 0:c.description)||"정보 없음"}

[등장인물]
${n.characters.map(o=>`- ${o.name} (${o.role})`).join(`
`)}

[대화 내용]
${a}

다음 형식의 JSON으로만 응답해주세요:
{
  "summary": "에피소드 요약 (200-300자, 감정과 분위기를 담아서)"
}
`;try{const A=(O=(T=(I=(f=(m=(await(await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:t}]}],generationConfig:{temperature:.7,maxOutputTokens:1024}})})).json()).candidates)==null?void 0:m[0])==null?void 0:f.content)==null?void 0:I.parts)==null?void 0:T[0])==null?void 0:O.text;if(A){const v=A.match(/\{[\s\S]*\}/);if(v){const J=JSON.parse(v[0]);p(i.id,{summary:J.summary})}}}catch(o){console.error("요약 생성 실패:",o),alert("요약 생성에 실패했습니다.")}finally{b(!1),C(null)}},s=async()=>{var r,c,m,f,I,T,O;if(!d||!((r=i==null?void 0:i.simulation)!=null&&r.turns))return;b(!0),C("storyboard");const a=i.simulation.turns.map(o=>`${o.characterName}: "${o.dialogue}" ${o.action?`(${o.action})`:""} [감정: ${o.emotion}]`).join(`
`),t=`
당신은 웹툰 콘티 전문가입니다.
다음 대화와 액션을 바탕으로 웹툰 콘티를 제안해주세요.

[장르]
${n.genre}

[분위기]
${n.mood||"자유"}

[등장인물]
${n.characters.map(o=>`- ${o.name}: ${o.appearance||"외모 미정"}`).join(`
`)}

[씬 정보]
${((c=i.scenes)==null?void 0:c.map(o=>`- 장소: ${o.location}, 시간: ${o.time}`).join(`
`))||"정보 없음"}

[대화/액션]
${a}

웹툰 형식에 맞게 8-12개의 컷(씬)으로 나눠주세요.
각 컷에는 샷 타입(와이드, 미디엄, 클로즈업 등)과 간단한 연출 설명을 포함해주세요.

다음 형식의 JSON으로만 응답해주세요:
{
  "storyboard": [
    "컷1: (와이드샷) 배경 전경, OO가 등장하는 장면",
    "컷2: (미디엄샷) OO의 표정과 대사",
    ...
  ]
}
`;try{const A=(O=(T=(I=(f=(m=(await(await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:t}]}],generationConfig:{temperature:.8,maxOutputTokens:2048}})})).json()).candidates)==null?void 0:m[0])==null?void 0:f.content)==null?void 0:I.parts)==null?void 0:T[0])==null?void 0:O.text;if(A){const v=A.match(/\{[\s\S]*\}/);if(v){const J=JSON.parse(v[0]);p(i.id,{storyboard:J.storyboard})}}}catch(o){console.error("콘티 생성 실패:",o),alert("콘티 생성에 실패했습니다.")}finally{b(!1),C(null)}},N=async()=>{await k(),await s()},L=()=>{var c,m;if(!((c=i==null?void 0:i.simulation)!=null&&c.turns))return;let l=`# ${n.title} - ${i.title}

`;(m=i.result)!=null&&m.summary&&(l+=`## 요약
${i.result.summary}

`),l+=`## 대사록
`,i.simulation.turns.forEach(f=>{l+=`
${f.characterName}: "${f.dialogue}"
`,f.action&&(l+=`(${f.action})
`)});const a=new Blob([l],{type:"text/plain"}),t=URL.createObjectURL(a),r=document.createElement("a");r.href=t,r.download=`${n.title}_${i.title}.txt`,r.click(),URL.revokeObjectURL(t)};return e.jsxs("div",{className:"result-tab",children:[e.jsxs("div",{className:"result-layout",children:[e.jsxs("div",{className:"episode-sidebar",children:[e.jsx("h3",{children:"에피소드 목록"}),e.jsx("div",{className:"episode-list",children:n.episodes.length>0?n.episodes.map(l=>{var a;return e.jsxs("button",{className:`episode-item ${_===l.id?"active":""}`,onClick:()=>y(l.id),children:[e.jsxs("span",{className:"ep-number",children:[l.number,"화"]}),e.jsx("span",{className:"ep-title",children:l.title}),((a=l.simulation)==null?void 0:a.status)==="completed"&&e.jsx("span",{className:"ep-badge",children:"완료"})]},l.id)}):e.jsx("p",{className:"empty-message",children:"시뮬레이션 탭에서 에피소드를 만들고 시뮬레이션을 진행해주세요."})})]}),e.jsx("div",{className:"result-content",children:i?e.jsxs("div",{className:"section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("span",{className:"icon",children:"📖"}),e.jsxs("h2",{children:[i.title," 완성본"]})]}),e.jsx("div",{className:"view-tabs",children:[{id:"summary",label:"요약",icon:"📝"},{id:"dialogue",label:"대사록",icon:"💬"},{id:"storyboard",label:"콘티",icon:"🎬"}].map(l=>e.jsxs("button",{className:`view-tab ${j===l.id?"active":""}`,onClick:()=>g(l.id),children:[e.jsx("span",{children:l.icon}),e.jsx("span",{children:l.label})]},l.id))}),j==="summary"&&e.jsx("div",{className:"view-content",children:(P=i.result)!=null&&P.summary?e.jsxs("div",{className:"summary-content",children:[e.jsx("p",{children:i.result.summary}),e.jsx("button",{className:"btn-secondary regenerate-btn",onClick:k,disabled:h,children:"🔄 다시 생성"})]}):e.jsxs("div",{className:"empty-content",children:[e.jsx("p",{children:"시뮬레이션 결과를 바탕으로 AI가 요약을 생성합니다."}),(G=i.simulation)!=null&&G.turns&&i.simulation.turns.length>0?e.jsx("button",{className:"btn-primary",onClick:k,disabled:h||!d,children:h&&S==="summary"?"⏳ 요약 생성 중...":"🚀 AI 요약 생성"}):e.jsx("p",{className:"hint",children:"먼저 시뮬레이션을 완료해주세요."})]})}),j==="dialogue"&&e.jsx("div",{className:"view-content",children:(z=i.simulation)!=null&&z.turns&&i.simulation.turns.length>0?e.jsx("div",{className:"dialogue-list",children:i.simulation.turns.map((l,a)=>e.jsxs("div",{className:"dialogue-item",children:[e.jsx("div",{className:"dialogue-name",children:l.characterName}),e.jsxs("div",{className:"dialogue-text",children:['"',l.dialogue,'"']}),l.action&&e.jsx("div",{className:"dialogue-action",children:l.action})]},a))}):e.jsx("div",{className:"empty-content",children:e.jsx("p",{children:"시뮬레이션 결과가 없습니다."})})}),j==="storyboard"&&e.jsx("div",{className:"view-content",children:(R=i.result)!=null&&R.storyboard&&i.result.storyboard.length>0?e.jsxs("div",{className:"storyboard-section",children:[e.jsx("div",{className:"storyboard-list",children:i.result.storyboard.map((l,a)=>e.jsxs("div",{className:"storyboard-item",children:[e.jsxs("div",{className:"scene-number",children:["씬 ",a+1]}),e.jsx("div",{className:"scene-desc",children:l})]},a))}),e.jsx("button",{className:"btn-secondary regenerate-btn",onClick:s,disabled:h,children:"🔄 다시 생성"})]}):e.jsxs("div",{className:"empty-content",children:[e.jsx("p",{children:"시뮬레이션 결과를 바탕으로 AI가 콘티를 제안합니다."}),(E=i.simulation)!=null&&E.turns&&i.simulation.turns.length>0?e.jsx("button",{className:"btn-primary",onClick:s,disabled:h||!d,children:h&&S==="storyboard"?"⏳ 콘티 생성 중...":"🚀 AI 콘티 생성"}):e.jsx("p",{className:"hint",children:"먼저 시뮬레이션을 완료해주세요."}),e.jsxs("div",{className:"storyboard-preview",children:[e.jsx("h4",{children:"콘티 예시"}),e.jsxs("div",{className:"preview-list",children:[e.jsxs("div",{className:"preview-item",children:[e.jsx("span",{className:"preview-num",children:"컷1"}),e.jsx("span",{children:"(와이드샷) 배경 전경"})]}),e.jsxs("div",{className:"preview-item",children:[e.jsx("span",{className:"preview-num",children:"컷2"}),e.jsx("span",{children:"(미디엄샷) 주인공 등장"})]}),e.jsxs("div",{className:"preview-item",children:[e.jsx("span",{className:"preview-num",children:"컷3"}),e.jsx("span",{children:"(클로즈업) 표정 연출"})]})]})]})]})}),e.jsxs("div",{className:"action-buttons",children:[((D=i.simulation)==null?void 0:D.turns)&&i.simulation.turns.length>0&&e.jsx("button",{className:"btn-primary",onClick:N,disabled:h||!d,children:h?"⏳ 생성 중...":"🚀 요약 + 콘티 전체 생성"}),e.jsx("button",{className:"btn-secondary",onClick:L,children:"📥 텍스트로 내보내기"})]})]}):e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{className:"empty-icon",children:"📖"}),e.jsx("h3",{children:"에피소드를 선택하세요"}),e.jsx("p",{children:"왼쪽에서 에피소드를 선택하면 결과를 확인할 수 있습니다."})]})})]}),e.jsx("style",{children:`
        .result-tab {
          height: 100%;
        }

        .result-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px;
          height: calc(100vh - 200px);
        }

        .episode-sidebar {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          overflow-y: auto;
        }

        .episode-sidebar h3 {
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
          margin: 0 0 16px 0;
        }

        .episode-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .episode-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .episode-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .episode-item.active {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.3);
        }

        .ep-number {
          font-size: 12px;
          color: #7c3aed;
          font-weight: 600;
        }

        .ep-title {
          flex: 1;
          font-size: 14px;
          color: #cbd5e1;
        }

        .ep-badge {
          font-size: 10px;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .empty-message {
          font-size: 13px;
          color: #64748b;
          text-align: center;
          padding: 20px;
          line-height: 1.6;
        }

        .result-content {
          overflow-y: auto;
        }

        .result-content .section {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .view-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .view-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
        }

        .view-tab.active {
          background: rgba(124, 58, 237, 0.2);
          color: #a855f7;
        }

        .view-content {
          flex: 1;
          overflow-y: auto;
        }

        .summary-content p {
          font-size: 15px;
          color: #cbd5e1;
          line-height: 1.8;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .regenerate-btn {
          align-self: flex-start;
        }

        .storyboard-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hint {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
        }

        .dialogue-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dialogue-item {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        .dialogue-name {
          font-size: 13px;
          font-weight: 600;
          color: #a855f7;
          margin-bottom: 4px;
        }

        .dialogue-text {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .dialogue-action {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
          margin-top: 4px;
        }

        .storyboard-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .storyboard-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        .scene-number {
          font-size: 12px;
          font-weight: 600;
          color: #7c3aed;
          white-space: nowrap;
        }

        .scene-desc {
          font-size: 14px;
          color: #cbd5e1;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .empty-content p {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .storyboard-preview {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
          width: 100%;
          max-width: 400px;
        }

        .storyboard-preview h4 {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 12px 0;
        }

        .preview-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-item {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #64748b;
        }

        .preview-num {
          color: #7c3aed;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .result-layout {
            grid-template-columns: 1fr;
          }
        }
      `})]})}const pe=()=>({id:`project-${Date.now()}`,title:"새 프로젝트",genre:"",keywords:[],mood:"",characters:[],episodes:[],createdAt:Date.now(),updatedAt:Date.now()}),Q="gemini_api_key";function he(){const n=ee(),{assets:u}=Z(),[d,_]=x.useState("setting"),[y,j]=x.useState(pe()),[g,h]=x.useState(!1),[b,S]=x.useState("");x.useEffect(()=>{const s=localStorage.getItem(Q);s&&S(s)},[]);const C=s=>{S(s),s&&localStorage.setItem(Q,s)},i=[{id:"setting",label:"설정",icon:"⚙️"},{id:"character",label:"캐릭터",icon:"👥"},{id:"simulation",label:"시뮬레이션",icon:"🎬"},{id:"result",label:"완성본",icon:"📖"}],p=s=>{j(N=>({...N,...s,updatedAt:Date.now()}))},k=()=>{const s=i.findIndex(N=>N.id===d);s<i.length-1&&_(i[s+1].id)};return e.jsxs("div",{className:"story-ai",children:[e.jsxs("header",{className:"story-header",children:[e.jsxs("div",{className:"header-left",children:[e.jsx("button",{className:"back-btn",onClick:()=>n("/workspace"),children:"← 대시보드"}),e.jsx("h1",{children:"📚 스토리 AI"})]}),e.jsx("div",{className:"header-center",children:e.jsx("input",{type:"text",className:"project-title-input",value:y.title,onChange:s=>p({title:s.target.value}),placeholder:"프로젝트 이름"})}),e.jsx("div",{className:"header-right",children:e.jsxs("button",{className:`library-btn ${g?"active":""}`,onClick:()=>h(!g),children:["📚 라이브러리 (",u.length,")"]})})]}),e.jsx("nav",{className:"story-tabs",children:i.map((s,N)=>e.jsxs("button",{className:`tab-btn ${d===s.id?"active":""}`,onClick:()=>_(s.id),children:[e.jsx("span",{className:"tab-number",children:N+1}),e.jsx("span",{className:"tab-icon",children:s.icon}),e.jsx("span",{className:"tab-label",children:s.label})]},s.id))}),e.jsxs("main",{className:"story-content",children:[d==="setting"&&e.jsx(se,{project:y,updateProject:p,apiKey:b,setApiKey:C,onNext:k}),d==="character"&&e.jsx(oe,{project:y,updateProject:p,apiKey:b,onNext:k}),d==="simulation"&&e.jsx(ce,{project:y,updateProject:p,apiKey:b,onNext:k}),d==="result"&&e.jsx(de,{project:y,updateProject:p,apiKey:b})]}),g&&e.jsxs("aside",{className:"shared-library-sidebar",children:[e.jsxs("div",{className:"library-header",children:[e.jsx("h3",{children:"📚 공유 라이브러리"}),e.jsx("button",{onClick:()=>h(!1),children:"✕"})]}),e.jsx("div",{className:"library-content",children:u.length===0?e.jsxs("p",{className:"empty-library",children:["라이브러리가 비어있습니다.",e.jsx("br",{}),"화이트보드에서 이미지를 생성하면 여기에 저장됩니다."]}):e.jsx("div",{className:"library-grid",children:u.map(s=>e.jsxs("div",{className:"library-item",children:[e.jsx("img",{src:s.url,alt:s.prompt||"이미지"}),s.prompt&&e.jsx("div",{className:"library-item-prompt",children:s.prompt})]},s.id))})})]})]})}export{he as default};
