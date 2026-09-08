import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { paletteFor } from '@/constants/theme';

export default function TabsLayout(){
  const {session}=useAuth(); const {theme}=useTheme(); const c=paletteFor(theme);
  const client=session?.role==='CLIENTE'; const provider=session?.role==='PROVEEDOR'; const admin=session?.role==='ADMIN';
  const icon:Record<string,any>={index:'home-outline',catalog:'storefront-outline',requests:'clipboard-outline',history:'time-outline',profile:'person-outline',more:'ellipsis-horizontal-circle-outline'};
  return <Tabs screenOptions={({route})=>({headerStyle:{backgroundColor:c.navy},headerTintColor:'#fff',headerTitleStyle:{fontWeight:'800'},tabBarStyle:{backgroundColor:c.surfaceRaised,borderTopColor:c.border},tabBarActiveTintColor:c.accent,tabBarInactiveTintColor:c.muted,sceneStyle:{backgroundColor:c.bg},tabBarIcon:({color,size})=><Ionicons name={icon[route.name]||'grid-outline'} size={size} color={color}/>})}>
    <Tabs.Screen name="index" options={{title:provider?'Inicio proveedor':session?.role==='ADMIN'?'Panel administrador':'Inicio'}}/>
    <Tabs.Screen name="catalog" options={{title:'Catálogo',href:client?undefined:null}}/>
    <Tabs.Screen name="requests" options={{title:'Solicitudes',href:session?.role==='ADMIN'?null:undefined}}/>
    <Tabs.Screen name="history" options={{title:'Historial',href:client?undefined:null}}/>
    <Tabs.Screen name="more" options={{title:'Más',href:provider?undefined:null}}/>
    <Tabs.Screen name="admin" options={{title:'Dashboard',href:null}}/>
    <Tabs.Screen name="admin-users" options={{title:'Usuarios',href:admin?undefined:null}}/>
    <Tabs.Screen name="admin-providers" options={{title:'Proveedores',href:admin?undefined:null}}/>
    <Tabs.Screen name="admin-more" options={{title:'Más',href:admin?undefined:null}}/>
    <Tabs.Screen name="profile" options={{title:'Perfil',href:admin?null:undefined}}/>
    <Tabs.Screen name="provider-claims" options={{href:null}}/><Tabs.Screen name="provider-deliveries" options={{href:null}}/><Tabs.Screen name="provider-payments" options={{href:null}}/><Tabs.Screen name="provider-products" options={{href:null}}/><Tabs.Screen name="provider-api" options={{href:null}}/>
  </Tabs>;
}
