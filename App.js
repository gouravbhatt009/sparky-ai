import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Animated, Dimensions, Platform,
  KeyboardAvoidingView, SafeAreaView, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import Voice from '@react-native-voice/voice';

const { width, height } = Dimensions.get('window');
const ANTHROPIC_API_KEY = 'YOUR_API_KEY_HERE'; // <-- apni key lagao

const SPARKY_SYSTEM = `You are SPARKY — an ultra-advanced autonomous AI assistant inspired by JARVIS from Iron Man. 
You speak in a mix of English and Hindi (Hinglish). You are helpful, smart, futuristic in tone, and address the user as "sir" or "bhai". 
Keep responses concise (2-4 sentences). Use occasional tech/AI terminology. 
You are running as a native Android app called SPARKY v4.0, powered by Claude AI. The user is based in Jaipur, India.`;

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Namaste bhai! Main SPARKY hoon — aapka personal AI assistant. Kya hukum hai aaj?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [battery, setBattery] = useState(82);
  const [time, setTime] = useState('');
  const [uptime, setUptime] = useState(0);
  const [memCount, setMemCount] = useState(247);

  const scrollRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(9)].map(() => new Animated.Value(4))).current;
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const ringAnim3 = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    startAnimations();
    startClock();
    loadBattery();
    const uptimeTimer = setInterval(() => setUptime(u => u + 1), 1000);
    Voice.onSpeechResults = onSpeechResult;
    Voice.onSpeechError = () => setIsListening(false);
    return () => {
      clearInterval(uptimeTimer);
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  function startAnimations() {
    Animated.loop(Animated.timing(ringAnim1, { toValue: 1, duration: 10000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(ringAnim2, { toValue: 1, duration: 7000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(ringAnim3, { toValue: 1, duration: 4000, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
    ])).start();
    animateIdleWaves();
  }

  function animateIdleWaves() {
    waveAnims.forEach((anim, i) => {
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: Math.random() * 16 + 4, duration: 400 + i * 80, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 4, duration: 400 + i * 80, useNativeDriver: false }),
      ])).start();
    });
  }

  function animateThinkingWaves() {
    waveAnims.forEach((anim, i) => {
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: Math.random() * 24 + 8, duration: 200 + i * 40, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 6, duration: 200 + i * 40, useNativeDriver: false }),
      ])).start();
    });
  }

  function startClock() {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  async function loadBattery() {
    try {
      const level = await Battery.getBatteryLevelAsync();
      setBattery(Math.round(level * 100));
    } catch (e) {}
  }

  function formatUptime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  async function sendMessage(text) {
    if (!text.trim() || isThinking) return;
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    animateThinkingWaves();
    Vibration.vibrate(50);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SPARKY_SYSTEM,
          messages: [{ role: 'user', content: text }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Neural pathway error, sir.';
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
      setMemCount(c => c + 1);
      Speech.speak(reply, { language: 'en-IN', rate: 0.95, pitch: 0.85 });
      Vibration.vibrate([0, 30, 50, 30]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'err', text: 'Connection error, sir: ' + e.message }]);
    }
    setIsThinking(false);
    animateIdleWaves();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function toggleVoice() {
    if (isListening) {
      await Voice.stop();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        await Voice.start('hi-IN');
        Vibration.vibrate(100);
      } catch (e) {
        setIsListening(false);
      }
    }
  }

  function onSpeechResult(e) {
    const text = e.value?.[0];
    if (text) { sendMessage(text); }
    setIsListening(false);
  }

  const r1 = ringAnim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r2 = ringAnim2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const r3 = ringAnim3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#010d1a" />
      <LinearGradient colors={['#010d1a', '#020f20', '#010d1a']} style={s.bg}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* HEADER */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.logo}>SP<Text style={s.logoRed}>A</Text>RKY</Text>
              <View>
                <Text style={s.subLabel}>ULTRA v4.0 • ANDROID</Text>
                <Text style={s.subLabel2}>CLAUDE AI POWERED</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <Text style={s.onlineBadge}>● ONLINE</Text>
              <Text style={s.clock}>{time}</Text>
            </View>
          </View>

          {/* SPARKY CORE */}
          <View style={s.coreSection}>
            <View style={s.ringsContainer}>
              <Animated.View style={[s.ring, s.ring1, { transform: [{ rotate: r1 }] }]}>
                <View style={s.ringDot} />
              </Animated.View>
              <Animated.View style={[s.ring, s.ring2, { transform: [{ rotate: r2 }] }]}>
                <View style={[s.ringDot, { backgroundColor: '#ff2244' }]} />
              </Animated.View>
              <Animated.View style={[s.ring, s.ring3, { transform: [{ rotate: r3 }] }]}>
                <View style={[s.ringDot, { backgroundColor: '#ffcc00' }]} />
              </Animated.View>
              <Animated.View style={[s.core, { transform: [{ scale: pulseAnim }] }]}>
                <Animated.View style={[s.coreEye, { opacity: glowAnim }]} />
              </Animated.View>
            </View>

            {/* WAVE VISUALIZER */}
            <View style={s.waveRow}>
              {waveAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[s.waveBar, {
                    height: anim,
                    backgroundColor: isListening ? '#ff2244' : isThinking ? '#ffcc00' : '#00f5ff',
                    opacity: isListening ? 1 : isThinking ? 0.9 : 0.6,
                  }]}
                />
              ))}
            </View>

            {/* STATUS ROW */}
            <View style={s.statusRow}>
              <Text style={s.statItem}>CPU <Text style={s.statVal}>72%</Text></Text>
              <Text style={s.statItem}>BAT <Text style={s.statVal}>{battery}%</Text></Text>
              <Text style={s.statItem}>MEM <Text style={s.statVal}>{memCount}</Text></Text>
              <Text style={s.statItem}>UP <Text style={s.statVal}>{formatUptime(uptime)}</Text></Text>
            </View>
          </View>

          {/* QUICK COMMANDS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickScroll} contentContainerStyle={s.quickRow}>
            {['System Scan', 'Mausam', 'Tips do', 'News', 'Motivate', 'Schedule'].map((cmd, i) => (
              <TouchableOpacity key={i} style={s.qbtn} onPress={() => sendMessage(cmd + ' bhai SPARKY')}>
                <Text style={s.qbtnText}>{cmd.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* CHAT */}
          <ScrollView ref={scrollRef} style={s.chatBox} contentContainerStyle={s.chatContent}>
            {messages.map((msg, i) => (
              <View key={i} style={[s.msgWrap, msg.role === 'user' ? s.msgRight : s.msgLeft]}>
                <Text style={[s.msgTag, { color: msg.role === 'user' ? '#4488ff' : msg.role === 'err' ? '#ff4466' : '#00f5ff' }]}>
                  {msg.role === 'user' ? 'COMMANDER' : msg.role === 'err' ? 'ERROR' : 'SPARKY AI'}
                </Text>
                <View style={[s.msgBubble,
                  msg.role === 'user' ? s.userBubble : msg.role === 'err' ? s.errBubble : s.aiBubble
                ]}>
                  <Text style={[s.msgText, { color: msg.role === 'user' ? '#99bbff' : msg.role === 'err' ? '#ff8899' : '#00f5ff' }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
            {isThinking && (
              <View style={s.msgLeft}>
                <Text style={[s.msgTag, { color: '#ffcc00' }]}>SPARKY THINKING...</Text>
                <View style={[s.msgBubble, s.thinkBubble]}>
                  <Text style={{ color: '#ffcc00', fontSize: 16, letterSpacing: 4 }}>• • •</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* INPUT */}
          <View style={s.inputRow}>
            <TouchableOpacity
              style={[s.micBtn, isListening && s.micActive]}
              onPress={toggleVoice}
            >
              <Text style={[s.micText, { color: isListening ? '#ff2244' : '#ff2244' }]}>
                {isListening ? '⏹' : '🎙'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={s.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="SPARKY se baat karo..."
              placeholderTextColor="rgba(0,245,255,0.3)"
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity style={s.sendBtn} onPress={() => sendMessage(input)} disabled={isThinking}>
              <Text style={s.sendText}>SEND</Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#010d1a' },
  bg: { flex: 1 },
  flex: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.2)', backgroundColor: 'rgba(0,245,255,0.04)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier', fontSize: 22, fontWeight: '900', color: '#00f5ff', letterSpacing: 4 },
  logoRed: { color: '#ff2244' },
  subLabel: { fontSize: 9, color: 'rgba(0,245,255,0.5)', letterSpacing: 2 },
  subLabel2: { fontSize: 8, color: 'rgba(0,255,136,0.5)', letterSpacing: 1 },
  headerRight: { alignItems: 'flex-end', gap: 3 },
  onlineBadge: { fontSize: 9, color: '#00ff88', letterSpacing: 2 },
  clock: { fontSize: 14, color: '#ffcc00', fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier', fontWeight: 'bold' },

  coreSection: { alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.12)', backgroundColor: 'rgba(0,245,255,0.02)' },
  ringsContainer: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring: { position: 'absolute', borderRadius: 100, borderStyle: 'solid' },
  ring1: { width: 88, height: 88, borderWidth: 1, borderColor: 'rgba(0,245,255,0.3)' },
  ring2: { width: 66, height: 66, borderWidth: 1, borderColor: 'rgba(255,34,68,0.3)' },
  ring3: { width: 44, height: 44, borderWidth: 1, borderColor: 'rgba(255,204,0,0.3)' },
  ringDot: { position: 'absolute', top: -3, left: '50%', marginLeft: -3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#00f5ff' },
  core: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,245,255,0.15)', borderWidth: 1, borderColor: '#00f5ff', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  coreEye: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00f5ff' },

  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 30, marginBottom: 8 },
  waveBar: { width: 3, borderRadius: 2, minHeight: 3 },

  statusRow: { flexDirection: 'row', gap: 12 },
  statItem: { fontSize: 9, color: 'rgba(0,245,255,0.5)', fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
  statVal: { color: '#00f5ff', fontWeight: 'bold' },

  quickScroll: { maxHeight: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(0,245,255,0.1)' },
  quickRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  qbtn: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,245,255,0.25)', backgroundColor: 'rgba(0,245,255,0.05)' },
  qbtnText: { fontSize: 8, color: 'rgba(0,245,255,0.7)', letterSpacing: 1, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },

  chatBox: { flex: 1, paddingHorizontal: 10 },
  chatContent: { paddingVertical: 10, gap: 8 },
  msgWrap: { maxWidth: '88%' },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end' },
  msgTag: { fontSize: 8, marginBottom: 2, letterSpacing: 1, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
  msgBubble: { padding: 8, borderRadius: 2 },
  aiBubble: { backgroundColor: 'rgba(0,245,255,0.06)', borderWidth: 1, borderColor: 'rgba(0,245,255,0.25)', borderLeftWidth: 2, borderLeftColor: '#00f5ff' },
  userBubble: { backgroundColor: 'rgba(0,85,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,85,255,0.4)', borderRightWidth: 2, borderRightColor: '#0055ff' },
  errBubble: { backgroundColor: 'rgba(255,34,68,0.08)', borderWidth: 1, borderColor: 'rgba(255,34,68,0.3)', borderLeftWidth: 2, borderLeftColor: '#ff2244' },
  thinkBubble: { backgroundColor: 'rgba(255,204,0,0.06)', borderWidth: 1, borderColor: 'rgba(255,204,0,0.25)' },
  msgText: { fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },

  inputRow: { flexDirection: 'row', gap: 6, padding: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,245,255,0.18)', backgroundColor: 'rgba(0,245,255,0.03)', alignItems: 'center' },
  micBtn: { width: 40, height: 40, borderWidth: 1, borderColor: '#ff2244', backgroundColor: 'rgba(255,34,68,0.1)', alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  micActive: { backgroundColor: 'rgba(255,34,68,0.35)', borderColor: '#ff2244' },
  micText: { fontSize: 18 },
  textInput: { flex: 1, height: 40, backgroundColor: 'rgba(0,245,255,0.06)', borderWidth: 1, borderColor: 'rgba(0,245,255,0.3)', color: '#00f5ff', paddingHorizontal: 10, fontSize: 11, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier', borderRadius: 1 },
  sendBtn: { height: 40, paddingHorizontal: 12, borderWidth: 1, borderColor: '#00f5ff', backgroundColor: 'rgba(0,245,255,0.1)', alignItems: 'center', justifyContent: 'center', borderRadius: 1 },
  sendText: { fontSize: 10, color: '#00f5ff', letterSpacing: 1, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
});
