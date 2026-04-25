'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth';

export default function AuthModal() {
    const { isOpen, closeAuth, login } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    async function handleSubmit() {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: mode,
                username,
                email,
                password
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        if (data.token && data.user) {
            login(data.user, data.token);
        }

        closeAuth();
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeAuth}>
            <DialogContent className="space-y-4">
                <h2 className="text-lg font-semibold">
                    {mode === 'login' ? 'Login' : 'Register'}
                </h2>

                <Input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {mode === 'register' && (
                    <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                )}

                <Button onClick={handleSubmit} className="w-full">
                    {mode === 'login' ? 'Login' : 'Register'}
                </Button>

                <Button
                    variant="ghost"
                    onClick={() =>
                        setMode(mode === 'login' ? 'register' : 'login')
                    }
                    className="w-full"
                >
                    Switch to {mode === 'login' ? 'Register' : 'Login'}
                </Button>
            </DialogContent>
        </Dialog>
    );
}