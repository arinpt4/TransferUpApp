import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdvisorScreen from "@/screens/AdvisorScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AlertsStackParamList = {
  Advisor: undefined;
};

const Stack = createNativeStackNavigator<AlertsStackParamList>();

export default function AlertsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Advisor"
        component={AdvisorScreen}
        options={{
          title: "Transfer Advisor",
        }}
      />
    </Stack.Navigator>
  );
}
