import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CircleDot, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Seo } from "@/components/Seo";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({ onSuccess: (user) => { utils.auth.me.setData(undefined, user as never); setLocation("/admin"); } });
  const register = trpc.auth.register.useMutation({ onSuccess: (result) => { setNotice(result.message); toast.success(result.isDefaultAdmin ? "Default admin account created." : "Registration received."); if (!result.isDefaultAdmin) { setPassword(""); } } });

  useEffect(() => { setNotice(""); }, [mode]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (mode === "login") await login.mutateAsync({ email, password });
      else await register.mutateAsync({ name, email, password });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };
  const pending = login.isPending || register.isPending;
  const isLogin = mode === "login";

  return <main className="auth-page">
    <Seo title={isLogin ? "Log in — Threaded Forms" : "Register — Threaded Forms"} description={isLogin ? "Log in to the private Threaded Forms studio dashboard." : "Register for an approved Threaded Forms studio account."} path={isLogin ? "/login" : "/register"} />
    <div className="auth-art"><a className="auth-back" href="/"><ArrowLeft size={15} /> Back to studio</a><div className="auth-art-copy"><p className="auth-kicker">TEHILA'S STUDIO / PRIVATE DESK</p><h1>The work<br /><em>continues</em><br />behind the scenes.</h1><p>Manage the shop, upcoming gatherings, portfolio images, journal, and commission enquiries from one quiet place.</p></div><span className="auth-art-caption">A studio is also a record<br />of the things worth making.</span></div>
    <section className="auth-card-wrap"><a className="auth-brand" href="/"><span className="logo-mark"><CircleDot size={17} /></span><span><b>Threaded Forms</b><small>Tehila's studio</small></span></a><div className="auth-card"><p className="auth-kicker">{isLogin ? "WELCOME BACK" : "JOIN THE STUDIO"}</p><h2>{isLogin ? "Log in." : "Create your account."}</h2><p className="auth-intro">{isLogin ? "Enter your approved account details to continue to the studio desk." : "The first account becomes the default admin. Every later account waits for admin approval before it can log in."}</p><form onSubmit={submit}>{!isLogin && <label className="auth-field"><span>Name</span><div><UserRound size={17} /><input required minLength={2} value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></div></label>}<label className="auth-field"><span>Email address</span><div><Mail size={17} /><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></div></label><label className="auth-field"><span>Password</span><div><LockKeyhole size={17} /><input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><button className="auth-submit" disabled={pending}>{isLogin ? "Log in to the studio" : "Create account"}<ArrowRight size={16} /></button></form>{notice && <div className="auth-notice">{notice}{!isLogin && notice.includes("default admin") && <a href="/login">Go to login <ArrowRight size={14} /></a>}</div>}<p className="auth-switch">{isLogin ? "Need an account?" : "Already registered?"} <a href={isLogin ? "/register" : "/login"}>{isLogin ? "Register here" : "Log in"}</a></p></div><p className="auth-security"><LockKeyhole size={13} /> Accounts are protected with salted password hashing.</p></section>
  </main>;
}
