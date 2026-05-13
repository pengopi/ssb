import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090B' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="student/[id]" />
      <Stack.Screen name="rate-student" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-student" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-session" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-announcement" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-match" options={{ presentation: 'modal' }} />
      <Stack.Screen name="attendance/[sessionId]" />
      <Stack.Screen name="add-payment" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-permission" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
