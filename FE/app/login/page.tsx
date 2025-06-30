"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Phone, User } from "lucide-react";
import { signup, login } from "@/api/user";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    birth: "",
    genderCode: "",
    gender: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [valid, setValid] = useState<{ [key: string]: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);

  // 실시간 유효성 검사
  useEffect(() => {
    const errs: { [key: string]: string } = {};
    const valids: { [key: string]: boolean } = {};

    // 이메일 형식
    if (!form.email) {
      valids.email = false;
    } else if (!form.email.match(/^\S+@\S+\.\S+$/)) {
      errs.email = "이메일 형식이 일치하지 않습니다.";
      valids.email = false;
    } else {
      valids.email = true;
    }

    // 비밀번호 형식 (영문 + 숫자 8자 이상)
    if (!form.password) {
      valids.password = false;
    } else if (!form.password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+]{8,}$/)) {
      errs.password = "비밀번호 형식이 일치하지 않습니다.";
      valids.password = false;
    } else {
      valids.password = true;
    }

    // 전화번호 형식
    if (!form.phone) {
      valids.phone = false;
    } else if (!form.phone.match(/^010-\d{4}-\d{4}$/)) {
      errs.phone = "전화번호 형식이 일치하지 않습니다.";
      valids.phone = false;
    } else {
      valids.phone = true;
    }

    // 주민등록번호 앞 6자리와 성별코드 1자리
    if ((form.birth && !form.birth.match(/^\d{6}$/)) || (form.genderCode && !form.genderCode.match(/^[1-4]$/))) {
      errs.birth = "주민번호 형식이 일치하지 않습니다.";
      valids.birth = false;
    } else {
      valids.birth = true;
      if (["1", "3"].includes(form.genderCode)) form.gender = "남자";
      else if (["2", "4"].includes(form.genderCode)) form.gender = "여자";
    }

    setErrors(errs);
    setValid(valids);
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  // 제출 처리 (회원가입 or 로그인)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;

    try {
      if (isLogin) {
        const token = await login({ email: form.email, password: form.password });
        localStorage.setItem("token", token);
        alert("로그인 성공!");
      } else {
        await signup({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          birthDate: form.birth,
          genderCode: form.genderCode,
          gender: form.gender,
          investmentStyle: "기본", // 필요 시 사용자 선택으로 수정
        });
        alert("회원가입 성공!");
      }
      router.push("/");
    } catch (err) {
      alert("처리에 실패했습니다.");
    }
  };

  return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
        <div className="flex items-center justify-center w-[1400px] h-[1400px] bg-gradient-to-br from-[#248D5D19] to-[#248E5D50] rounded-full absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[700px] h-[700px] bg-white rounded-full absolute z-5"></div>
        </div>
        <div className="w-[200px] h-[400px] bg-white absolute z-5 -bottom-1/4 right-1/4 -rotate-45"></div>
        <div className="w-full max-w-sm absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <Image src="/stockr_green.svg" alt="Stoc.kr logo" width={60} height={60} />
            </div>
            <h1 className="text-2xl font-bold text-gray-700">
              Stoc.kr {isLogin ? "로그인" : "회원가입"}
            </h1>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {!isLogin && (
                  <>
                    {/* 이름 */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-600">이름</label>
                      <div className="relative">
                        <Input id="name" value={form.name} onChange={handleChange} placeholder="이름을 입력하세요." className="h-12 text-sm pl-10" />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                    </div>

                    {/* 전화번호 */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-gray-600">전화번호</label>
                      <div className="relative">
                        <Input id="phone" value={form.phone} onChange={handleChange} placeholder="010-1234-5678" className="h-12 text-sm pl-10" />
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                      {!form.phone && <p className="text-xs text-gray-500">010-1234-5678 형식으로 입력해주세요.</p>}
                      {form.phone && (valid.phone ? <p className="text-xs text-green-500">형식이 일치합니다.</p> : <p className="text-xs text-red-500">{errors.phone}</p>)}
                    </div>

                    {/* 주민번호 앞자리 + 성별코드 */}
                    <div className="flex space-x-2 items-end">
                      <div className="space-y-2 w-2/3">
                        <label htmlFor="birth" className="text-sm font-medium text-gray-600">주민번호 앞자리</label>
                        <Input id="birth" value={form.birth} onChange={handleChange} placeholder="YYMMDD" className="h-12 text-sm" />
                      </div>
                      <div className="space-y-2 w-1/3">
                        <label htmlFor="genderCode" className="text-sm font-medium text-gray-600">- 뒤 1자리</label>
                        <Input id="genderCode" value={form.genderCode} onChange={handleChange} className="h-12 text-sm" />
                      </div>
                    </div>
                    {form.birth && (valid.birth ? <p className="text-xs text-green-500">형식이 일치합니다.</p> : <p className="text-xs text-red-500">{errors.birth}</p>)}
                  </>
              )}

              {/* 이메일 */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-600">이메일</label>
                <div className="relative">
                  <Input id="email" value={form.email} onChange={handleChange} placeholder="이메일을 입력하세요." className="h-12 text-sm pl-10" />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {form.email && (valid.email ? <p className="text-xs text-green-500">형식이 일치합니다.</p> : <p className="text-xs text-red-500">{errors.email}</p>)}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2 relative">
                <label htmlFor="password" className="text-sm font-medium text-gray-600">비밀번호</label>
                <div className="relative">
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="비밀번호를 입력하세요."
                      className="h-12 text-sm pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {!form.password && <p className="text-xs text-gray-500">8자 이상, 영문+숫자 포함</p>}
                {form.password && (valid.password ? <p className="text-xs text-green-500">형식이 일치합니다.</p> : <p className="text-xs text-red-500">{errors.password}</p>)}
              </div>

              {/* 제출 버튼 */}
              <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90">
                {isLogin ? "로그인" : "회원가입"}
              </Button>
              <p className="text-center text-sm text-gray-600">
                {isLogin ? "아직 회원이 아니신가요?" : "이미 계정이 있으신가요?"}{" "}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline">
                  {isLogin ? "회원가입" : "로그인"}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
  );
}
