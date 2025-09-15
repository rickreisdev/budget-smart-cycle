
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, User, Lock, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import MonthSelector from '@/components/MonthSelector';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<{email: string, password: string, username: string} | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Store user data and show month selector
    setPendingUserData({ email, password, username });
    setShowMonthSelector(true);
  };

  const handleMonthSelected = async (selectedMonth: string) => {
    if (!pendingUserData) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: pendingUserData.email,
        password: pendingUserData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: pendingUserData.username,
            initial_cycle: selectedMonth
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else {
          toast.error(error.message);
        }
        setShowMonthSelector(false);
        setPendingUserData(null);
      } else {
        toast.success('Cadastro realizado com sucesso! Verifique seu email.');
        setShowMonthSelector(false);
        setPendingUserData(null);
        // Clear form
        setEmail('');
        setPassword('');
        setUsername('');
      }
    } catch (error) {
      toast.error('Erro ao criar conta');
      setShowMonthSelector(false);
      setPendingUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error('Preencha email e senha');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  if (showMonthSelector) {
    return (
      <MonthSelector 
        onMonthSelected={handleMonthSelected}
        loading={loading}
        title="Configuração Inicial"
        description="Para finalizar seu cadastro, selecione o mês atual do seu controle financeiro."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              Budget Smart Cycle
            </CardTitle>
            <p className="text-green-100">Controle financeiro pessoal</p>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-login" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-login" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Senha
                    </Label>
                    <Input
                      id="password-login"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleSignIn} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nome de usuário
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="seu_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-signup" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-signup" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Senha
                    </Label>
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleSignUp} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Cadastrando...' : 'Criar conta'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
