import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SchoolsScreen from "@/screens/SchoolsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SchoolsStackParamList = {
  Schools: undefined;
};

const Stack = createNativeStackNavigator<SchoolsStackParamList>();

export default function SchoolsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Schools"
        component={SchoolsScreen}
        options={{
          title: "Schools",
        }}
      />
    </Stack.Navigator>
  );
}
