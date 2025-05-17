import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useUserRole() {
  const [userRole, setUserRole] = useState<string>("");
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let role = "";
        const directRole = await AsyncStorage.getItem('user_role');
        if (directRole) {
          role = directRole;
        } else {
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            role = user?.role ?? user?.user_role ?? "";
          }
        }
        if (isMounted) setUserRole(role);
      } catch {}
    })();
    return () => { isMounted = false; };
  }, []);
  return userRole;
}