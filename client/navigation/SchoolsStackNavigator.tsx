import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SchoolsScreen from "@/screens/SchoolsScreen";
import TransferRequirementsScreen from "@/screens/TransferRequirementsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SchoolsStackParamList = {
  Schools: undefined;
  TransferRequirements: {
    sendingId: number;
    sendingName: string;
    receivingId: number;
    receivingName: string;
  };
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
      <Stack.Screen
        name="TransferRequirements"
        component={TransferRequirementsScreen}
        options={{
          title: "Transfer Requirements",
        }}
      />
    </Stack.Navigator>
  );
}
