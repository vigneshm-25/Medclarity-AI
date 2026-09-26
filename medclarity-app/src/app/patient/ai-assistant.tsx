import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../../constants/theme';

export default function AiAssistantRoute() {
  const router = useRouter();

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>AI Health Assistant</Text>
        </View>

        <Card variant="glass" style={styles.card}>
          <Ionicons name="chatbubbles-outline" size={54} color={COLORS.primaryPurple} />
          <Text style={styles.cardTitle}>AI Assistant Planned for Phase 2</Text>
          <Text style={styles.cardDesc}>
            Interactive voice chatbot guidance and daily wellness check-ins are planned for Phase 2 release.
          </Text>
        </Card>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  card: {
    padding: 30,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryPurple,
    marginVertical: 12,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
