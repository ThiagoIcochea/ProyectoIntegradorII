import { Redirect } from 'expo-router'; import { Loading } from '@/components/ui'; import { useAuth } from '@/hooks/use-auth';
export default function Index() { const { session, ready } = useAuth(); if (!ready) return <Loading />; return <Redirect href={(session ? '/(tabs)' : '/(auth)/login') as any} />; }
