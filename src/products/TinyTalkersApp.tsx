import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, BookOpen, LogOut, Music2, Plus, Search, Trash2, Volume2 } from 'lucide-react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import backgroundMusicUrl from '../assets/kids-bg-music.mp3?inline'
import { firebaseAuth } from '../lib/firebase'

const isLocalDevelopment = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
const API_BASE = import.meta.env.VITE_API_BASE ?? (isLocalDevelopment ? 'http://localhost:4000/api' : `${window.location.origin}/api`)
const TOKEN_KEY = 'tt_token'
const USER_KEY = 'tt_user'
const avatarImages = import.meta.glob<string>('../assets/avatars/avatar*.jpg', { eager: true, query: '?url', import: 'default' })
const phoneticSounds = import.meta.glob<string>('../assets/phonetics/*.mp3', { eager: true, query: '?url', import: 'default' })

type Screen = 'login' | 'register' | 'avatar' | 'hub' | 'admin'
type CvcWord = { id: string; word: string; category: string; difficulty?: string }
type Category = { id: string; name: string }
type TinyTalkersUser = {
  id: number
  name: string
  email: string
  birthday: string | null
  age: number | null
  role: 'admin' | 'user'
  avatar: string
  firstLogin: boolean
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.9 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 -2)" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -2)" />
    </svg>
  )
}

async function apiRequest<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}/tiny-talkers${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || 'The server request failed.')
  return data as T
}

export default function TinyTalkersApp({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<TinyTalkersUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<TinyTalkersUser | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageIsSuccess, setMessageIsSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [words, setWords] = useState<CvcWord[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [bucket, setBucket] = useState<CvcWord[]>([])
  const [selectedWord, setSelectedWord] = useState<CvcWord | null>(null)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [showBucket, setShowBucket] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [musicPlaying, setMusicPlaying] = useState(false)
  const backgroundMusic = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (screen !== 'hub') {
      backgroundMusic.current?.pause()
      backgroundMusic.current = null
      setMusicPlaying(false)
      return
    }
    const audio = new Audio(backgroundMusicUrl)
    audio.loop = true
    audio.volume = 0.35
    backgroundMusic.current = audio
    return () => {
      audio.pause()
      if (backgroundMusic.current === audio) backgroundMusic.current = null
    }
  }, [screen])

  useEffect(() => {
    const persistedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
    if (!persistedToken) return
    setRememberMe(localStorage.getItem(TOKEN_KEY) !== null)
    apiRequest<TinyTalkersUser>('/auth/me', persistedToken).then(account => {
      setToken(persistedToken)
      setUser(account)
      setProfile(account)
      setScreen(account.role === 'admin' ? 'admin' : account.firstLogin ? 'avatar' : 'hub')
    }).catch(() => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    })
  }, [])

  useEffect(() => {
    if (!token || (screen !== 'hub' && screen !== 'admin')) return
    let active = true
    const loadLibrary = async () => {
      try {
        const [loadedWords, loadedCategories, loadedBucket] = await Promise.all([
          apiRequest<CvcWord[]>('/words', token),
          apiRequest<Category[]>('/categories', token),
          apiRequest<CvcWord[]>('/bucket', token),
        ])
        if (!active) return
        setWords(loadedWords)
        setCategories(loadedCategories)
        setBucket(loadedBucket)
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Could not load the word library.')
      }
    }
    loadLibrary()
    return () => {
      active = false
    }
  }, [screen, token])

  const openAccount = (account: TinyTalkersUser, authToken: string, notice = '', success = false) => {
    setToken(authToken)
    setProfile(account)
    setUser(account)
    const storage = rememberMe ? localStorage : sessionStorage
    const otherStorage = rememberMe ? sessionStorage : localStorage
    storage.setItem(TOKEN_KEY, authToken)
    storage.setItem(USER_KEY, JSON.stringify(account))
    otherStorage.removeItem(TOKEN_KEY)
    otherStorage.removeItem(USER_KEY)
    if (account.role === 'admin') setScreen('admin')
    else setScreen(account.firstLogin ? 'avatar' : 'hub')
    setMessage(notice)
    setMessageIsSuccess(success)
  }

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setMessageIsSuccess(false)
    try {
      const result = await apiRequest<{ user: TinyTalkersUser; token: string }>('/auth/login', undefined, {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      })
      openAccount(result.user, result.token)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  const register = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) return setMessage('Use a password with at least 8 characters.')
    if (password !== confirmPassword) return setMessage('The passwords do not match.')
    if (!acceptedTerms) return setMessage('Agree to the terms to create an account.')
    setBusy(true)
    setMessage('')
    setMessageIsSuccess(false)
    try {
      const result = await apiRequest<{ user: TinyTalkersUser; token: string; emailSent: boolean }>('/auth/register', undefined, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          birthday,
          email: identifier.trim(),
          password,
          acceptedTerms,
        }),
      })
      openAccount(
        result.user,
        result.token,
        result.emailSent
          ? `Registration successful. A confirmation email was sent to ${result.user.email}.`
          : 'Your account was created, but the confirmation email could not be sent. Please contact support.',
        result.emailSent,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!firebaseAuth) {
      setMessage('Google sign-in is not configured. Add the Firebase web app settings to the environment.')
      setMessageIsSuccess(false)
      return
    }

    setBusy(true)
    setMessage('')
    setMessageIsSuccess(false)
    try {
      let idToken = pendingGoogleIdToken
      let googleName = ''
      let googleEmail = ''
      if (!idToken) {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        const credential = await signInWithPopup(firebaseAuth, provider)
        idToken = await credential.user.getIdToken()
        googleName = credential.user.displayName || ''
        googleEmail = credential.user.email || ''
      }
      const result = await apiRequest<{
        user: TinyTalkersUser
        token: string
        created: boolean
        emailSent: boolean
        requiresTerms?: boolean
      }>('/auth/google', undefined, {
        method: 'POST',
        body: JSON.stringify({ idToken, acceptedTerms }),
      })
      if (result.requiresTerms) {
        setPendingGoogleIdToken(idToken)
        setName(googleName)
        setIdentifier(googleEmail)
        setAcceptedTerms(false)
        setMessage('This Google account is new to TinyTalkers. Accept the terms below, then continue with Google to finish creating your account.')
        return
      }
      setPendingGoogleIdToken(null)
      const notice = result.created
        ? result.emailSent
          ? `Registration successful. A confirmation email was sent to ${result.user.email}.`
          : 'Your account was created, but the confirmation email could not be sent. Please contact support.'
        : ''
      openAccount(result.user, result.token, notice, result.created && result.emailSent)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in with Google.')
    } finally {
      setBusy(false)
    }
  }

  const chooseAvatar = async (avatar: number) => {
    if (!token) return
    setBusy(true)
    try {
      const account = await apiRequest<TinyTalkersUser>('/auth/avatar', token, {
        method: 'PUT',
        body: JSON.stringify({ avatar }),
      })
      setProfile(account)
      setUser(account)
      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage
      storage.setItem(USER_KEY, JSON.stringify(account))
      setScreen('hub')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the avatar.')
    } finally {
      setBusy(false)
    }
  }

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }

  const playPhonetic = (letter: string) => {
    const soundUrl = phoneticSounds[`../assets/phonetics/${letter.toLowerCase()}.mp3`]
    if (!soundUrl) return speak(letter)
    const audio = new Audio(soundUrl)
    audio.play().catch(() => speak(letter))
  }

  const toggleBackgroundMusic = () => {
    const audio = backgroundMusic.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => setMusicPlaying(true)).catch(() => setMessage('Could not play background music.'))
    } else {
      audio.pause()
      setMusicPlaying(false)
    }
  }

  const saveWord = async (word: CvcWord) => {
    if (!token || bucket.some(item => item.id === word.id)) return
    try {
      await apiRequest(`/bucket/${word.id}`, token, { method: 'POST' })
      setBucket(current => [word, ...current])
      setMessage(`${word.word.toUpperCase()} added to your bucket.`)
      const celebration = new Audio('/celebration.mp3')
      celebration.volume = 0.6
      celebration.play().catch(() => {})
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this word.')
    }
  }

  const removeWord = async (wordId: string) => {
    if (!token) return
    try {
      await apiRequest(`/bucket/${wordId}`, token, { method: 'DELETE' })
      setBucket(current => current.filter(item => item.id !== wordId))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not remove this word.')
    }
  }

  const addAdminWord = async (event: FormEvent) => {
    event.preventDefault()
    const value = newWord.trim().toLowerCase()
    if (!token || !value || !category || !/^[^aeiou][aeiou][^aeiou]$/i.test(value)) {
      setMessage('Enter a three-letter consonant-vowel-consonant word and select a category.')
      return
    }
    try {
      const word = await apiRequest<CvcWord>('/words', token, {
        method: 'POST',
        body: JSON.stringify({ word: value, category }),
      })
      setWords(current => [...current, word])
      setNewWord('')
      setMessage('Word added.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add the word.')
    }
  }

  const addAdminCategory = async (event: FormEvent) => {
    event.preventDefault()
    const value = newCategory.trim()
    if (!token || value.length < 2) return setMessage('Category names need at least 2 characters.')
    try {
      const item = await apiRequest<Category>('/categories', token, {
        method: 'POST',
        body: JSON.stringify({ name: value }),
      })
      setCategories(current => [...current, item])
      setNewCategory('')
      setMessage('Category added.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add the category.')
    }
  }

  const deleteAdminCategory = async (item: Category) => {
    const wordCount = words.filter(word => word.category === item.name).length
    const wordLabel = wordCount === 1 ? '1 word' : `${wordCount} words`
    if (!token || !window.confirm(`Delete "${item.name}" and its ${wordLabel}? Those words will also be removed from learners' buckets.`)) return
    setBusy(true)
    try {
      const deleted = await apiRequest<{ name: string; wordsDeleted: number }>(`/categories/${item.id}`, token, { method: 'DELETE' })
      setCategories(current => current.filter(categoryItem => categoryItem.id !== item.id))
      setWords(current => current.filter(word => word.category !== deleted.name))
      setBucket(current => current.filter(word => word.category !== deleted.name))
      if (category === deleted.name) setCategory('')
      if (selectedWord?.category === deleted.name) setSelectedWord(null)
      setMessage(`Deleted ${deleted.name} and ${deleted.wordsDeleted} ${deleted.wordsDeleted === 1 ? 'word' : 'words'}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete the category.')
    } finally {
      setBusy(false)
    }
  }

  const signOutOfProduct = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setProfile(null)
    setWords([])
    setCategories([])
    setBucket([])
    setMessage('')
    setMessageIsSuccess(false)
    setScreen('login')
  }

  const visibleWords = (showBucket ? bucket : words).filter(word =>
    (!category || word.category === category) && word.word.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-[#f3f7f4] px-4 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><BookOpen size={21} /></div>
          <div><p className="font-bold leading-tight">TinyTalkers</p><p className="text-xs text-slate-500">Oikos learning</p></div>
        </div>
        {screen === 'login' || screen === 'register' ? (
          <button onClick={onExit} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Oikos home</button>
        ) : (
          <div className="flex items-center gap-4">
            {screen === 'hub' && <button onClick={toggleBackgroundMusic} title={musicPlaying ? 'Pause background music' : 'Play background music'} aria-label={musicPlaying ? 'Pause background music' : 'Play background music'} className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900">{musicPlaying ? <Volume2 size={18} /> : <Music2 size={18} />}</button>}
            <button onClick={signOutOfProduct} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><LogOut size={16} /> Sign out</button>
          </div>
        )}
      </div>

      {(screen === 'login' || screen === 'register') && (
        <section className="mx-auto mt-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-blue-700">TinyTalkers</p>
            <h1 className="mt-2 text-2xl font-bold">{screen === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p className="mt-1 text-sm text-slate-600">{screen === 'login' ? 'Sign in to continue your reading routine.' : 'Set up a space for your reading practice.'}</p>
          </div>
          {screen === 'login' ? (
            <form className="space-y-4" onSubmit={login}>
              <label className="block text-sm font-medium">Email or username<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" autoComplete="username" required value={identifier} onChange={event => setIdentifier(event.target.value)} /></label>
              <label className="block text-sm font-medium">Password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} /> Remember me</label>
              </div>
              <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
              {pendingGoogleIdToken && (
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} />
                  <span>I agree to the Terms of Service and Privacy Policy.</span>
                </label>
              )}
              <button
                type="button"
                disabled={busy || Boolean(pendingGoogleIdToken && !acceptedTerms)}
                onClick={signInWithGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <GoogleIcon /> {pendingGoogleIdToken ? 'Create account with Google' : 'Continue with Google'}
              </button>
              <p className="text-center text-xs text-slate-500">Use your Google account to sign in or create an account. No TinyTalkers password needed.</p>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={register}>
              <label className="block text-sm font-medium">Your name<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" autoComplete="name" required value={name} onChange={event => setName(event.target.value)} /></label>
              <label className="block text-sm font-medium">Date of birth<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" type="date" required value={birthday} onChange={event => setBirthday(event.target.value)} /></label>
              <label className="block text-sm font-medium">Email<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" type="email" autoComplete="email" required value={identifier} onChange={event => setIdentifier(event.target.value)} /></label>
              <label className="block text-sm font-medium">Password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label>
              <label className="block text-sm font-medium">Confirm password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" type="password" autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
              <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} /> I agree to the Terms of Service and Privacy Policy.</label>
              <button disabled={busy || !acceptedTerms} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? 'Creating account…' : 'Create account'}</button>
              <button type="button" disabled={busy || !acceptedTerms} onClick={signInWithGoogle} className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <GoogleIcon /> Sign up with Google
              </button>
            </form>
          )}
          <p className="mt-5 text-center text-sm text-slate-600">
            {screen === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMessage(''); setMessageIsSuccess(false); setPendingGoogleIdToken(null); setScreen(screen === 'login' ? 'register' : 'login') }} className="font-semibold text-blue-700 hover:underline">{screen === 'login' ? 'Create one' : 'Sign in'}</button>
          </p>
          {message && <p role={messageIsSuccess ? 'status' : 'alert'} className={`mt-4 rounded-lg px-3 py-2 text-sm ${messageIsSuccess ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{message}</p>}
        </section>
      )}

      {screen === 'avatar' && (
        <section className="mx-auto mt-10 max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold">Choose an avatar</h1>
          <p className="mt-1 text-sm text-slate-600">Welcome, {user?.name || profile?.name || 'reader'}.</p>
          <div className="mt-6 grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, index) => index + 1).map(avatar => (
              <button key={avatar} disabled={busy} onClick={() => chooseAvatar(avatar)} aria-label={`Choose avatar ${avatar}`} className="aspect-square overflow-hidden rounded-full border-2 border-slate-200 bg-blue-50 hover:border-blue-600 disabled:opacity-50"><img src={avatarImages[`../assets/avatars/avatar${avatar}.jpg`]} alt={`Avatar ${avatar}`} className="h-full w-full object-cover" /></button>
            ))}
          </div>
          {message && <p role={messageIsSuccess ? 'status' : 'alert'} className={`mt-4 text-sm ${messageIsSuccess ? 'text-emerald-700' : 'text-rose-700'}`}>{message}</p>}
        </section>
      )}

      {screen === 'hub' && (
        <section className="mx-auto mt-8 max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-semibold text-blue-700">Learning space</p><h1 className="mt-1 text-2xl font-bold">Learning Hub</h1><p className="mt-1 text-sm text-slate-600">Draw, listen, and save CVC words.</p></div>
            <button onClick={() => setShowBucket(value => !value)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">{showBucket ? 'Word pool' : `My bucket (${bucket.length})`}</button>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold uppercase text-slate-500">{selectedWord?.category || 'Your word'}</p>
                <p className="mt-2 text-7xl font-black tracking-wide text-slate-900">{selectedWord?.word.toUpperCase() || '—'}</p>
                {selectedWord && <div className="mt-5 flex gap-2">{selectedWord.word.split('').map((letter, index) => <button key={`${letter}-${index}`} onClick={() => playPhonetic(letter)} aria-label={`Hear ${letter}`} className="grid h-12 w-12 place-items-center rounded-lg border border-slate-300 text-lg font-semibold uppercase hover:bg-slate-100">{letter}</button>)}</div>}
                {selectedWord && <button onClick={() => speak(selectedWord.word)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><Volume2 size={17} /> Play word</button>}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-slate-100 pt-5">
                <button onClick={() => { const pool = visibleWords.length ? visibleWords : words; setSelectedWord(pool[Math.floor(Math.random() * pool.length)] || null) }} disabled={!visibleWords.length && !words.length} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">Draw a word</button>
                {selectedWord && <button onClick={() => saveWord(selectedWord)} className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50">Save to bucket</button>}
              </div>
            </div>
            <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="relative block"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input aria-label="Search words" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search words" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm" /></label>
              <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Category<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case"><option value="">All categories</option>{categories.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {visibleWords.map(word => <div key={word.id} className="flex items-center gap-2"><button onClick={() => setSelectedWord(word)} className="flex-1 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100">{word.word.toUpperCase()} <span className="ml-1 font-normal text-slate-500">{word.category}</span></button>{showBucket && <button onClick={() => removeWord(word.id)} aria-label={`Remove ${word.word}`} className="rounded p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700">×</button>}</div>)}
                {!visibleWords.length && <p className="py-5 text-center text-sm text-slate-500">No words found.</p>}
              </div>
            </aside>
          </div>
          {message && <p role="status" className="mt-4 text-sm text-slate-600">{message}</p>}
        </section>
      )}

      {screen === 'admin' && (
        <section className="mx-auto mt-8 max-w-4xl">
          <h1 className="text-2xl font-bold">TinyTalkers content</h1>
          <p className="mt-1 text-sm text-slate-600">Manage CVC words and learning categories.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <form onSubmit={addAdminWord} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Add a CVC word</h2>
              <input value={newWord} onChange={event => setNewWord(event.target.value)} placeholder="cat" maxLength={3} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2" />
              <select value={category} onChange={event => setCategory(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Choose category</option>{categories.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
              <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"><Plus size={16} /> Add word</button>
            </form>
            <form onSubmit={addAdminCategory} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Add a category</h2>
              <input value={newCategory} onChange={event => setNewCategory(event.target.value)} placeholder="Animals" className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2" />
              <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold"><Plus size={16} /> Add category</button>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <h3 className="text-sm font-semibold">Categories</h3>
                <ul className="mt-2 divide-y divide-slate-100">
                  {categories.map(item => (
                    <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{item.name} <span className="text-slate-500">({words.filter(word => word.category === item.name).length} words)</span></span>
                      <button type="button" disabled={busy} onClick={() => deleteAdminCategory(item)} title={`Delete ${item.name}`} aria-label={`Delete ${item.name} category`} className="grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={16} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            </form>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Word library</h2>
            <div className="mt-3 divide-y divide-slate-100">{words.map(word => <div key={word.id} className="flex items-center justify-between py-2 text-sm"><span>{word.word.toUpperCase()} <span className="text-slate-500">{word.category}</span></span><button onClick={async () => { if (!token) return; try { await apiRequest(`/words/${word.id}`, token, { method: 'DELETE' }); setWords(current => current.filter(item => item.id !== word.id)) } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete the word.') } }} className="text-rose-700 hover:underline">Delete</button></div>)}</div>
          </div>
          {message && <p role="status" className="mt-4 text-sm text-slate-600">{message}</p>}
        </section>
      )}
    </main>
  )
}