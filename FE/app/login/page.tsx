"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Phone, User } from "lucide-react";
import { signup, login } from "@/api/user";
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { toast } = useToast()
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

    // 회원가입 모드일 때만 유효성 검사 수행
    if (!isLogin) {
      // 이메일 형식
      if (!form.email) {
        valids.email = false;
      } else if (!form.email.match(/^\S+@\S+\.\S+$/)) {
        errs.email = "이메일 형식이 일치하지 않습니다.";
        valids.email = false;
      } else {
        valids.email = true;
      }

      // 비밀번호 형식 (영문 + 숫자 + 특수문자 8~20자)
      if (!form.password) {
        valids.password = false;
      } else if (!form.password.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/)) {
        errs.password = "비밀번호는 8~20자, 영문/숫자/특수문자를 포함해야 합니다.";
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
      if (form.birth || form.genderCode) {
        let birthValid = true;
        let genderValid = true;

        // 생년월일 형식 검증 (YYMMDD)
        if (form.birth) {
          if (!form.birth.match(/^\d{6}$/)) {
            birthValid = false;
          } else {
            const year = parseInt(form.birth.substring(0, 2));
            const month = parseInt(form.birth.substring(2, 4));
            const day = parseInt(form.birth.substring(4, 6));

            // 월: 01-12, 일: 01-31 범위 체크
            if (month < 1 || month > 12 || day < 1 || day > 31) {
              birthValid = false;
            }
          }
        }

        // 성별코드 검증 (1, 2, 3, 4만 허용)
        if (form.genderCode && !form.genderCode.match(/^[1-4]$/)) {
          genderValid = false;
        }

        if (!birthValid || !genderValid) {
          errs.birth = "주민번호 형식이 일치하지 않습니다.";
          valids.birth = false;
        } else if (form.birth && form.genderCode) {
          valids.birth = true;
          if (["1", "3"].includes(form.genderCode)) form.gender = "남자";
          else if (["2", "4"].includes(form.genderCode)) form.gender = "여자";
        } else {
          valids.birth = false;
        }
      } else {
        valids.birth = false;
      }
    }

    setErrors(errs);
    setValid(valids);
  }, [form, isLogin]);

  // 로그인/회원가입 모드 전환 시 폼 초기화
  useEffect(() => {
    setForm({
      email: "",
      password: "",
      name: "",
      phone: "",
      birth: "",
      genderCode: "",
      gender: "",
    });
    setErrors({});
    setValid({});
  }, [isLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id === 'phone') {
      // 전화번호 자동 하이픈 삽입
      const phoneNumber = value.replace(/[^\d]/g, ''); // 숫자만 추출
      let formattedPhone = '';
      
      if (phoneNumber.length <= 3) {
        formattedPhone = phoneNumber;
      } else if (phoneNumber.length <= 7) {
        formattedPhone = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
      } else if (phoneNumber.length <= 11) {
        formattedPhone = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
      } else {
        // 11자리 초과시 무시
        return;
      }
      
      setForm({ ...form, [id]: formattedPhone });
    } else if (id === 'birth') {
      // 생년월일은 숫자만 허용
      const birthValue = value.replace(/[^\d]/g, '');
      if (birthValue.length <= 6) {
        setForm({ ...form, [id]: birthValue });
      }
    } else if (id === 'genderCode') {
      // 성별코드는 1-4만 허용
      if (value === '' || /^[1-4]$/.test(value)) {
        setForm({ ...form, [id]: value });
      }
    } else {
      setForm({ ...form, [id]: value });
    }
  };

  // 제출 처리 (회원가입 or 로그인)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      // 회원가입 시 필수 필드 체크
      if (!form.email || !form.password || !form.name || !form.phone || !form.birth || !form.genderCode) {
        toast({
          variant: "destructive",
          title: "오류",
          description: "모든 필드를 입력해주세요."
        });
        return;
      }
    } else {
      // 로그인 시 필수 필드 체크
      if (!form.email || !form.password) {
        toast({
          variant: "destructive",
          title: "오류",
          description: "이메일과 비밀번호를 입력해주세요."
        });
        return;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "입력 형식을 확인해주세요."
      });
      return;
    }

    try {
      if (isLogin) {
        const token = await login({ email: form.email, password: form.password });
        localStorage.setItem("token", token);
        
        // 쿠키에도 토큰 저장 (middleware에서 사용)
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7일간 유지
        
        toast({
          title: "성공",
          description: "로그인이 완료되었습니다!"
        });
        router.push("/dashboard");
      } else {
        await signup({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          birthDate: form.birth,
          genderCode: form.genderCode,
          gender: form.gender,
          investmentStyle: "기본",
        });
        
        localStorage.removeItem("token");
        toast({
          title: "성공",
          description: "회원가입이 완료되었습니다! 로그인해주세요."
        });
        
        setIsLogin(true);
        setForm({
          email: "",
          password: "",
          name: "",
          phone: "",
          birth: "",
          genderCode: "",
          gender: "",
        });
        return;
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "오류",
        description: err.message || "처리에 실패했습니다."
      });
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
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              {!isLogin && (
                  <>
                    {/* 이름 */}
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        이름
                      </label>
                      <div className="relative">
                        <Input 
                          id="name" 
                          value={form.name} 
                          onChange={handleChange} 
                          placeholder="이름을 입력하세요" 
                          className="h-10 text-sm pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg transition-all duration-200" 
                        />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                    </div>

                    {/* 전화번호 */}
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        전화번호
                      </label>
                      <div className="relative">
                        <Input 
                          id="phone" 
                          value={form.phone} 
                          onChange={handleChange} 
                          maxLength={13}
                          placeholder="010-0000-0000"
                          className="h-10 text-sm pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg transition-all duration-200" 
                        />
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      </div>
                      {form.phone && !valid.phone && <p className="text-xs text-red-500 leading-tight">{errors.phone}</p>}
                    </div>

                    {/* 주민번호 앞자리 + 성별코드 */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        주민등록번호
                      </label>
                      <div className="flex gap-2 items-center w-full">
                        <Input 
                          id="birth" 
                          value={form.birth} 
                          onChange={handleChange} 
                          placeholder="YYMMDD" 
                          maxLength={6} 
                          className="h-10 flex-1 text-sm text-center border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg transition-all duration-200 font-mono" 
                        />
                        <span className="text-gray-400 font-bold">-</span>
                        <Input 
                          id="genderCode" 
                          value={form.genderCode} 
                          onChange={handleChange} 
                          maxLength={1} 
                          className="h-10 w-12 text-sm text-center border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg transition-all duration-200 font-mono" 
                        />
                        <span className="text-gray-300 text-xs">●●●●●●</span>
                      </div>
                      {(form.birth || form.genderCode) && !valid.birth && <p className="text-xs text-red-500 leading-tight">{errors.birth}</p>}
                    </div>
                  </>
              )}

              {/* 이메일 */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  이메일
                </label>
                <div className="relative">
                  <Input 
                    id="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    placeholder="이메일을 입력하세요" 
                    className="h-10 text-sm pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg transition-all duration-200"
                    autoComplete="off"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
                {!isLogin && form.email && !valid.email && <p className="text-xs text-red-500 leading-tight">{errors.email}</p>}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  비밀번호
                </label>
                <div className="relative">
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="비밀번호를 입력하세요"
                      className="h-10 text-sm pl-10 pr-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg transition-all duration-200"
                      autoComplete="off"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isLogin && form.password && !valid.password && <p className="text-xs text-red-500 leading-tight">{errors.password}</p>}
                {!isLogin && !form.password && <p className="text-xs text-gray-500 leading-tight">8~20자, 영문+숫자+특수문자 포함</p>}
              </div>

              {/* 제출 버튼 */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLogin ? "로그인" : "회원가입"}
                </Button>
              </div>
              
              <div className="text-center pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {isLogin ? "아직 회원이 아니신가요?" : "이미 계정이 있으신가요?"}{" "}
                  <button 
                    type="button" 
                    onClick={() => setIsLogin(!isLogin)} 
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {isLogin ? "회원가입" : "로그인"}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
