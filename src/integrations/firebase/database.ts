type Query = Record<string, string | number | boolean | undefined> | URLSearchParams | undefined;
const STORAGE_KEY = "fatu_pirate_quest_mock_db_v2";
const DEMO_PASSWORD_HASH = "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d";
const clone = <T>(value: T): T => value == null ? value : JSON.parse(JSON.stringify(value));

const initialMockData = () => {
  const now = new Date();
  const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();
  const participants = {
    "demo-p1": { id:"demo-p1", first_name:"พิมพ์ชนก", last_name:"ศรีสมบัติ", age:17, grade_level:"ม.6", school:"โรงเรียนสวนกุหลาบวิทยาลัย รังสิต", program:"ศิลป์-คำนวณ", username:"pirate01", password_hash:DEMO_PASSWORD_HASH, points:0, phone_number:"0811111111", created_at:iso(420), credentials_generated_at:iso(420) },
    "demo-p2": { id:"demo-p2", first_name:"ธนกฤต", last_name:"ชัยวัฒน์", age:18, grade_level:"ม.6", school:"โรงเรียนธรรมศาสตร์คลองหลวงวิทยาคม", program:"วิทย์-คณิต", username:"pirate02", password_hash:DEMO_PASSWORD_HASH, points:100, phone_number:"0822222222", created_at:iso(380), credentials_generated_at:iso(380) },
    "demo-p3": { id:"demo-p3", first_name:"ณัฐชา", last_name:"พรหมรักษ์", age:17, grade_level:"ม.5", school:"โรงเรียนเตรียมอุดมศึกษาพัฒนาการ ปทุมธานี", program:"ศิลป์ภาษา", username:"pirate03", password_hash:DEMO_PASSWORD_HASH, points:200, phone_number:"0833333333", created_at:iso(330), credentials_generated_at:iso(330) },
    "demo-p4": { id:"demo-p4", first_name:"กิตติพงษ์", last_name:"วงศ์สวัสดิ์", age:18, grade_level:"ม.6", school:"โรงเรียนหอวัง", program:"ศิลป์-คำนวณ", username:"pirate04", password_hash:DEMO_PASSWORD_HASH, points:300, phone_number:"0844444444", created_at:iso(280), credentials_generated_at:iso(280) },
    "demo-p5": { id:"demo-p5", first_name:"ชลธิชา", last_name:"บุญมี", age:18, grade_level:"ม.6", school:"โรงเรียนสตรีวิทยา 2", program:"ศิลป์ภาษา", username:"pirate05", password_hash:DEMO_PASSWORD_HASH, points:200, phone_number:"0855555555", created_at:iso(230), credentials_generated_at:iso(230) },
    "demo-p6": { id:"demo-p6", first_name:"ภูริณัฐ", last_name:"แสงทอง", age:17, grade_level:"ม.5", school:"โรงเรียนบดินทรเดชา", program:"วิทย์-คณิต", username:"pirate06", password_hash:DEMO_PASSWORD_HASH, points:400, phone_number:"0866666666", created_at:iso(180), credentials_generated_at:iso(180) }
  };
  return {
    participants,
    participants_by_username:{ pirate01:"demo-p1", pirate02:"demo-p2", pirate03:"demo-p3", pirate04:"demo-p4", pirate05:"demo-p5", pirate06:"demo-p6" },
    checkins:{
      "demo-p2":{"1":{participant_id:"demo-p2",location_id:1,method:"subevent_auto",created_at:iso(210)}},
      "demo-p3":{"1":{participant_id:"demo-p3",location_id:1,method:"subevent_auto",created_at:iso(190)},"2":{participant_id:"demo-p3",location_id:2,method:"subevent_auto",created_at:iso(170)}},
      "demo-p4":{"1":{participant_id:"demo-p4",location_id:1,method:"subevent_auto",created_at:iso(160)},"3":{participant_id:"demo-p4",location_id:3,method:"subevent_auto",created_at:iso(140)},"4":{participant_id:"demo-p4",location_id:4,method:"subevent_auto",created_at:iso(120)}},
      "demo-p5":{"2":{participant_id:"demo-p5",location_id:2,method:"subevent_auto",created_at:iso(110)},"3":{participant_id:"demo-p5",location_id:3,method:"subevent_auto",created_at:iso(95)}},
      "demo-p6":{"1":{participant_id:"demo-p6",location_id:1,method:"subevent_auto",created_at:iso(90)},"2":{participant_id:"demo-p6",location_id:2,method:"subevent_auto",created_at:iso(75)},"3":{participant_id:"demo-p6",location_id:3,method:"subevent_auto",created_at:iso(60)},"4":{participant_id:"demo-p6",location_id:4,method:"subevent_auto",created_at:iso(45)}}
    },
    sub_event_checkins:{
      "demo-p2":{"1-arts-management":{participant_id:"demo-p2",sub_event_id:"1-arts-management",location_id:1,points_awarded:100,created_at:iso(210)}},
      "demo-p3":{"1-survey":{participant_id:"demo-p3",sub_event_id:"1-survey",location_id:0,points_awarded:100,created_at:iso(190)},"2-moodboard-fashion":{participant_id:"demo-p3",sub_event_id:"2-moodboard-fashion",location_id:2,points_awarded:100,created_at:iso(170)}},
      "demo-p4":{"1-arts-management":{participant_id:"demo-p4",sub_event_id:"1-arts-management",location_id:1,points_awarded:100,created_at:iso(160)},"3-badge":{participant_id:"demo-p4",sub_event_id:"3-badge",location_id:3,points_awarded:100,created_at:iso(140)},"4-acting":{participant_id:"demo-p4",sub_event_id:"4-acting",location_id:4,points_awarded:100,created_at:iso(120)}},
      "demo-p5":{"2-moodboard-fashion":{participant_id:"demo-p5",sub_event_id:"2-moodboard-fashion",location_id:2,points_awarded:100,created_at:iso(110)},"3-weaving":{participant_id:"demo-p5",sub_event_id:"3-weaving",location_id:3,points_awarded:100,created_at:iso(95)}},
      "demo-p6":{"1-survey":{participant_id:"demo-p6",sub_event_id:"1-survey",location_id:0,points_awarded:100,created_at:iso(90)},"2-moodboard-fashion":{participant_id:"demo-p6",sub_event_id:"2-moodboard-fashion",location_id:2,points_awarded:100,created_at:iso(75)},"3-badge":{participant_id:"demo-p6",sub_event_id:"3-badge",location_id:3,points_awarded:100,created_at:iso(60)},"4-story-creation":{participant_id:"demo-p6",sub_event_id:"4-story-creation",location_id:4,points_awarded:100,created_at:iso(45)}}
    },
    spins:{ "demo-p5":{participant_id:"demo-p5",prize:"FATU Tote Bag",claim_code:"2580",claimed:false,created_at:iso(80)}, "demo-p6":{participant_id:"demo-p6",prize:"Pirate Sticker Set",claim_code:"6688",claimed:true,claimed_at:iso(20),created_at:iso(40)} },
    app_settings:{ points_required_for_wheel:{value:200} },
    settings:{ai:{knowledgeBase:"โหมดสาธิตแบบ Offline: ข้อมูลทั้งหมดเป็น mock data ใน browser"}}
  };
};

const loadRoot=():any=>{try{const s=localStorage.getItem(STORAGE_KEY);if(s)return JSON.parse(s);}catch(e){console.warn("Mock DB load failed",e)}const seed=initialMockData();localStorage.setItem(STORAGE_KEY,JSON.stringify(seed));return seed;};
const saveRoot=(root:any)=>localStorage.setItem(STORAGE_KEY,JSON.stringify(root));
const parts=(path:string)=>path.split("/").map(p=>p.trim()).filter(Boolean);
const readAt=(root:any,path:string)=>{let node=root;for(const key of parts(path)){if(node==null||typeof node!=="object"||!(key in node))return null;node=node[key];}return clone(node);};
const setAt=(root:any,path:string,value:any)=>{const keys=parts(path);if(!keys.length)return clone(value);let node=root;for(const key of keys.slice(0,-1)){if(!node[key]||typeof node[key]!=="object")node[key]={};node=node[key];}node[keys[keys.length-1]]=clone(value);return root;};
const removeAt=(root:any,path:string)=>{const keys=parts(path);if(!keys.length)return {};let node=root;for(const key of keys.slice(0,-1)){if(!node[key]||typeof node[key]!=="object")return root;node=node[key];}delete node[keys[keys.length-1]];return root;};

export const firebaseDb={
  get:async<T>(path:string,_query?:Query):Promise<T|null>=>readAt(loadRoot(),path) as T|null,
  set:async<T>(path:string,value:T):Promise<T>=>{saveRoot(setAt(loadRoot(),path,value));return clone(value);},
  update:async<T extends object>(path:string,value:T):Promise<T>=>{const root=loadRoot();const current=readAt(root,path);const merged={...(current&&typeof current==="object"?current:{}),...clone(value)};saveRoot(setAt(root,path,merged));return clone(merged) as T;},
  push:async<T>(path:string,value:T):Promise<{name:string}>=>{const name=crypto.randomUUID?crypto.randomUUID():`mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;saveRoot(setAt(loadRoot(),`${path}/${name}`,value));return{name};},
  remove:async(path:string):Promise<void>=>saveRoot(removeAt(loadRoot(),path))
};

export const resetMockDatabase=()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(initialMockData()));window.dispatchEvent(new CustomEvent("fatu-mock-db-reset"));};
