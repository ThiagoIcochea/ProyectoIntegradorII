import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons'; import * as Speech from 'expo-speech'; import { router, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/use-auth'; import { useThemedStyles } from '@/hooks/use-themed-styles'; import { b2bService } from '@/services/b2b.service'; import { apiError } from '@/services/api';

type Recognition = { isRecognitionAvailable:()=>boolean; requestPermissionsAsync:()=>Promise<{granted:boolean}>; start:(options:Record<string,unknown>)=>void; stop:()=>void; addListener:(event:string, listener:(event:any)=>void)=>{remove:()=>void} };
let recognition: Recognition | null = null;
// Expo Go cannot load custom native modules. Loading lazily keeps the app and root layout valid there;
// development/production builds use the real native recognizer declared in app.json.
if (Constants.executionEnvironment !== 'storeClient') { try { recognition = require('expo-speech-recognition').ExpoSpeechRecognitionModule as Recognition; } catch { recognition = null; } }
const normalize=(v:string)=>v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); const requestId=(v:string)=>Number(v.match(/(?:rfq|solicitud|pedido|numero)?\s*(\d{1,6})/i)?.[1]||0);
export function VoiceAssistant(){const {session,signOut}=useAuth();const path=usePathname();const [listening,setListening]=useState(false);const [thinking,setThinking]=useState(false);const [message,setMessage]=useState(recognition?'Toca el micrófono y di un comando.':'La voz requiere una development build.');const [pending,setPending]=useState(false);
  const statusOpacity=useRef(new Animated.Value(1)).current;const fadeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const showStatus=useCallback(()=>{if(fadeTimer.current){clearTimeout(fadeTimer.current);fadeTimer.current=null;}statusOpacity.stopAnimation();statusOpacity.setValue(1);},[statusOpacity]);
  const scheduleFade=useCallback((text:string)=>{if(fadeTimer.current)clearTimeout(fadeTimer.current);const delay=Math.min(9000,Math.max(4000,text.length*70));fadeTimer.current=setTimeout(()=>{Animated.timing(statusOpacity,{toValue:0,duration:700,useNativeDriver:true}).start();},delay);},[statusOpacity]);
  const say=useCallback((text:string)=>{showStatus();setMessage(text);Speech.stop();Speech.speak(text,{language:'es-PE',rate:.95});scheduleFade(text);},[showStatus,scheduleFade]);const navigate=useCallback((route:string)=>router.push(route as never),[]);
  const handleText=useCallback(async(raw:string)=>{const text=normalize(raw);if(!text)return;if(pending){const id=requestId(text);if(!id){say('No identifiqué el número. Di solicitud 12.');return;}setPending(false);say(`Abriendo el tracking de la solicitud ${id}.`);navigate(`/request/${id}`);return;}
    if(/(tracking|seguimiento|rastrear|seguir pedido|ver pedido)/.test(text)){if(session?.role!=='CLIENTE'){say('El tracking de compra está disponible para clientes.');return;}const id=requestId(text);if(id){say(`Abriendo el tracking de la solicitud ${id}.`);navigate(`/request/${id}`);}else{setPending(true);say('Dime el número de solicitud que deseas rastrear.');}return;}
    if(/(historial|solicitudes finalizadas)/.test(text)&&session?.role==='CLIENTE'){say('Abriendo historial.');navigate('/history');return;}
    if(/(catalogo|productos|nueva rfq|crear solicitud)/.test(text)&&session?.role==='CLIENTE'){say('Abriendo catálogo.');navigate('/(tabs)/catalog');return;}
    if(/(mis solicitudes|ver solicitudes)/.test(text)){say('Abriendo solicitudes.');navigate('/(tabs)/requests');return;}
    if(/(perfil|mi cuenta)/.test(text)){say('Abriendo tu perfil.');navigate('/(tabs)/profile');return;}
    if(/(resenas|reseñas|opiniones|comentarios)/.test(text)&&session?.role==='CLIENTE'){say('Abriendo reseñas.');navigate('/(tabs)/catalog');return;}
    if(/(top proveedores|ranking|mejores proveedores)/.test(text)){say('Abriendo ranking de proveedores.');navigate('/top-providers');return;}
    if(/(planes|membresia|suscripcion)/.test(text)&&session?.role==='PROVEEDOR'){say('Abriendo planes y beneficios.');navigate('/provider-plans');return;}
    if(/(mis pagos|pagos recibidos|ver pagos)/.test(text)&&session?.role==='PROVEEDOR'){say('Abriendo pagos.');navigate('/(tabs)/provider-payments');return;}
    if(/(entregas|envios|despachos)/.test(text)&&session?.role==='PROVEEDOR'){say('Abriendo entregas.');navigate('/(tabs)/provider-deliveries');return;}
    if(/(reclamos|quejas)/.test(text)&&session?.role==='PROVEEDOR'){say('Abriendo reclamos.');navigate('/(tabs)/provider-claims');return;}
    if(/(mis productos|catalogo de productos)/.test(text)&&session?.role==='PROVEEDOR'){say('Abriendo productos.');navigate('/(tabs)/provider-products');return;}
    if(/(configuracion de api|api de proveedor)/.test(text)&&session?.role==='PROVEEDOR'){say('Abriendo configuración de API.');navigate('/(tabs)/provider-api');return;}
    if(/(dashboard|panel de administrador|inicio)/.test(text)&&session?.role==='ADMIN'){say('Abriendo panel de administrador.');navigate('/(tabs)');return;}
    if(/(ver usuarios|lista de usuarios)/.test(text)&&session?.role==='ADMIN'){say('Abriendo usuarios.');navigate('/(tabs)/admin-users');return;}
    if(/(ver proveedores|lista de proveedores)/.test(text)&&session?.role==='ADMIN'){say('Abriendo proveedores.');navigate('/(tabs)/admin-providers');return;}
    if(/(cerrar sesion|salir de mi cuenta|logout)/.test(text)){await signOut();say('Sesión cerrada.');return;}
    const searchMatch=text.match(/^(?:busca|buscar|buscame|encuentra|encontrar)\s+(.+)/);
    if(searchMatch&&session?.role==='CLIENTE'){const query=searchMatch[1].replace(/\b(producto|productos|en el catalogo|en catalogo|por favor)\b/g,'').trim();if(query){say(`Buscando ${query} en el catálogo.`);navigate(`/(tabs)/catalog?search=${encodeURIComponent(query)}`);return;}}
    setThinking(true);try{const answer=await b2bService.voiceAssistant(raw,path);const reply=String(answer.answer||'No pude interpretar ese comando.');if(answer.action==='NAVIGATE'&&typeof answer.route==='string'){navigate(answer.route);}else if(answer.action==='SEARCH'&&typeof answer.search==='string'&&answer.search.trim()){if(session?.role==='CLIENTE')navigate(`/(tabs)/catalog?search=${encodeURIComponent(answer.search.trim())}`);}say(reply);}catch(error){say(apiError(error,'No pude procesar el comando de voz.'));}finally{setThinking(false);}},[navigate,path,pending,say,session?.role,signOut]);
  useEffect(()=>{if(!recognition)return;const start=recognition.addListener('start',()=>{setListening(true);showStatus();setMessage('Escuchando…');});const end=recognition.addListener('end',()=>setListening(false));const result=recognition.addListener('result',event=>{const transcript=event.results?.[0]?.transcript;if(transcript)void handleText(transcript);});const error=recognition.addListener('error',event=>{setListening(false);if(event.error!=='aborted')say(event.error==='not-allowed'?'Necesito permiso de micrófono y reconocimiento de voz.':'No pude escuchar bien. Intenta nuevamente.');});return()=>{start.remove();end.remove();result.remove();error.remove();};},[handleText,say,showStatus]);
  const toggle=async()=>{if(!recognition){Alert.alert('Development build requerida','Expo Go no incluye reconocimiento de voz nativo. Abre una development build para usar el micrófono.');return;}if(listening){recognition.stop();return;}if(!recognition.isRecognitionAvailable()){Alert.alert('Reconocimiento no disponible','Activa el reconocimiento de voz del dispositivo e inténtalo nuevamente.');return;}const permission=await recognition.requestPermissionsAsync();if(!permission.granted){say('Necesito permiso de micrófono y reconocimiento de voz para continuar.');return;}recognition.start({lang:'es-PE',interimResults:false,continuous:false,androidIntentOptions:{EXTRA_LANGUAGE_MODEL:'web_search'}});};
  const styles=useStyles();
  const pan=useRef(new Animated.ValueXY()).current; const dragging=useRef(false);
  const panResponder=useRef(PanResponder.create({
    onMoveShouldSetPanResponder:(_e,gesture)=>Math.abs(gesture.dx)>4||Math.abs(gesture.dy)>4,
    onPanResponderGrant:()=>{dragging.current=false;},
    onPanResponderMove:(_e,gesture)=>{dragging.current=true;pan.setValue({x:gesture.dx,y:gesture.dy});},
    onPanResponderRelease:()=>{pan.extractOffset();setTimeout(()=>{dragging.current=false;},50);},
  })).current;
  const onFabPress=()=>{if(dragging.current)return;showStatus();void toggle();};
  useEffect(()=>()=>{if(fadeTimer.current)clearTimeout(fadeTimer.current);},[]);
  return <Animated.View pointerEvents="box-none" style={[styles.wrap,{transform:pan.getTranslateTransform()}]} {...panResponder.panHandlers}><Animated.View style={[styles.status,{opacity:statusOpacity}]} pointerEvents="none"><Text style={styles.statusTitle}>{listening?'Escuchando':thinking?'Procesando':'Asistente de voz'}</Text><Text style={styles.statusText}>{message}</Text></Animated.View><Pressable accessibilityRole="button" accessibilityLabel={listening?'Detener asistente de voz':'Activar asistente de voz'} onPress={onFabPress} style={[styles.fab,listening&&styles.fabActive]}><Ionicons name={listening?'stop':'mic'} size={27} color="#fff"/></Pressable></Animated.View>;
}
const useStyles=()=>useThemedStyles(c=>StyleSheet.create({wrap:{position:'absolute',right:16,bottom:18,alignItems:'flex-end',gap:8},status:{maxWidth:250,padding:11,borderRadius:12,backgroundColor:c.surface,borderWidth:1,borderColor:c.border},statusTitle:{color:c.text,fontWeight:'800'},statusText:{color:c.muted,marginTop:3,fontSize:12},fab:{width:58,height:58,borderRadius:29,backgroundColor:c.primary,alignItems:'center',justifyContent:'center',elevation:5},fabActive:{backgroundColor:c.danger}}));
