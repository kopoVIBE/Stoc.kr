"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getMyInfo, updateInvestmentStyle } from "@/api/user";

interface SurveyOption {
  text: string;
  score: number;
}

interface SurveyQuestion {
  id: number;
  type: "radio" | "checkbox";
  question: string;
  options: SurveyOption[];
}

interface InvestmentType {
  name: string;
  color: string;
}

interface InvestmentSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SurveyAnswers {
  [key: number]: string | string[];
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "radio",
    question: "내가 투자하는 이유는",
    options: [
      { text: "자산 늘리기", score: 5 },
      { text: "생활비 마련", score: 3 },
      { text: "채무 상환", score: 1 },
    ],
  },
  {
    id: 2,
    type: "radio",
    question: "내 연 소득은",
    options: [
      { text: "1억원 이상", score: 5 },
      { text: "7천만원 이상 1억원 미만", score: 4 },
      { text: "5천만원 이상 7천만원 미만", score: 3 },
      { text: "3천만원 이상 5천만원 미만", score: 2 },
      { text: "3천만원 미만", score: 1 },
    ],
  },
  {
    id: 3,
    type: "radio",
    question: "금융 자산은 내 전체 자산 중",
    options: [
      { text: "50% 이상", score: 4 },
      { text: "30% 이상 50% 미만", score: 3 },
      { text: "10% 이상 30% 미만", score: 2 },
      { text: "10% 미만", score: 1 },
    ],
  },
  {
    id: 4,
    type: "checkbox",
    question: "지금까지 투자해본 것을 모두 골라주세요.",
    options: [
      { text: "예금, 적금", score: 1 },
      { text: "주식형 펀드", score: 3 },
      { text: "주식 직접투자", score: 4 },
      { text: "파생상품 (선물, 옵션 등)", score: 6 },
      { text: "구조화상품 (ELS, ELB 등)", score: 4 },
    ],
  },
  {
    id: 5,
    type: "radio",
    question: "나는 주식, 채권, 펀드를",
    options: [
      { text: "잘 알고 있다", score: 4 },
      { text: "어느 정도 알고 있다", score: 3 },
      { text: "조금 안다", score: 2 },
      { text: "거의 모른다", score: 1 },
    ],
  },
  {
    id: 6,
    type: "radio",
    question: "투자 수익을 위해",
    options: [
      { text: "많은 손실도 참을 수 있다", score: 5 },
      { text: "어느 정도 손실은 참을 수 있다", score: 4 },
      { text: "적은 손실은 참을 수 있다", score: 2 },
      { text: "원금을 잃을 수는 없다", score: 1 },
    ],
  },
  {
    id: 7,
    type: "radio",
    question: "나는 투자를",
    options: [
      { text: "3년 이상 계속할 것이다", score: 3 },
      { text: "3년 안에 그만둘 것이다", score: 2 },
      { text: "1년 안에 그만둘 것이다", score: 1 },
    ],
  },
];

const investmentTypes: InvestmentType[] = [
  { name: "안정형", color: "bg-emerald-300" },
  { name: "안정추구형", color: "bg-green-400" },
  { name: "위험중립형", color: "bg-yellow-400" },
  { name: "적극투자형", color: "bg-orange-400" },
  { name: "공격투자형", color: "bg-red-400" },
];

export default function InvestmentSurvey({
  isOpen,
  onClose,
  onSuccess,
}: InvestmentSurveyProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [showResult, setShowResult] = useState(false);
  const [resultType, setResultType] = useState<InvestmentType>(
    investmentTypes[0]
  );
  const [userName, setUserName] = useState<string>("");
  const [investmentStyleUpdatedAt, setInvestmentStyleUpdatedAt] = useState<string | null>(null);

  // 투자 성향 설정 날짜로부터 2년 후 날짜 계산
  const getValidUntilDate = () => {
    let baseDate: Date;
    
    if (investmentStyleUpdatedAt) {
      // 기존 투자 성향 설정 날짜가 있다면 그 날짜 사용
      baseDate = new Date(investmentStyleUpdatedAt);
    } else {
      // 없다면 현재 날짜 사용 (새로 설정하는 경우)
      baseDate = new Date();
    }
    
    const twoYearsLater = new Date(baseDate.getFullYear() + 2, baseDate.getMonth(), baseDate.getDate());
    
    return twoYearsLater.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await getMyInfo();
        setUserName(userInfo.name);
        setInvestmentStyleUpdatedAt(userInfo.investmentStyleUpdatedAt);
      } catch (error) {
        console.error("사용자 정보 가져오기 실패:", error);
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  const handleCheckboxChange = (checked: boolean, optionText: string) => {
    const currentAnswers = (answers[step] as string[]) || [];
    const newAnswers = checked
      ? [...currentAnswers, optionText]
      : currentAnswers.filter((ans: string) => ans !== optionText);
    setAnswers({ ...answers, [step]: newAnswers });
  };

  const calculateResult = () => {
    let totalScore = 0;
    surveyQuestions.forEach((q, index) => {
      const answer = answers[index];
      if (!answer) return;

      if (q.type === "radio") {
        const selectedOption = q.options.find((opt) => opt.text === answer);
        if (selectedOption) totalScore += selectedOption.score;
      } else if (q.type === "checkbox" && Array.isArray(answer)) {
        answer.forEach((ansText) => {
          const selectedOption = q.options.find((opt) => opt.text === ansText);
          if (selectedOption) totalScore += selectedOption.score;
        });
      }
    });

    if (totalScore <= 10) setResultType(investmentTypes[0]); // 안정형
    else if (totalScore <= 18) setResultType(investmentTypes[1]); // 안정추구형
    else if (totalScore <= 26) setResultType(investmentTypes[2]); // 위험중립형
    else if (totalScore <= 34) setResultType(investmentTypes[3]); // 적극투자형
    else setResultType(investmentTypes[4]); // 공격투자형
  };

  const handleNext = () => {
    if (step < surveyQuestions.length - 1) {
      setStep(step + 1);
    } else {
      calculateResult();
      setShowResult(true);
    }
  };

  const handleClose = async () => {
    if (showResult) {
      try {
        await updateInvestmentStyle(resultType.name);
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("투자 성향 저장 실패:", error);
        alert("투자 성향 저장에 실패했습니다.");
      }
    }
    
    setStep(0);
    setAnswers({});
    setShowResult(false);
    onClose();
  };

  if (!isOpen) return null;
  const currentQuestion = surveyQuestions[step];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {!showResult ? (
          <>
            <DialogHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  투자성향 조사
                </DialogTitle>
                <div className="flex items-center gap-2 mr-8">
                  <span className="text-2xl font-bold text-emerald-600">{step + 1}</span>
                  <span className="text-lg text-gray-400">/</span>
                  <span className="text-lg text-gray-600">{surveyQuestions.length}</span>
                </div>
              </div>
              
              {/* 진행 바 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>진행률</span>
                  <span>{Math.round(((step + 1) / surveyQuestions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((step + 1) / surveyQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border-l-4 border-emerald-500">
                <p className="text-lg font-semibold text-gray-800">
                  {currentQuestion.question}
                </p>
              </div>
            </DialogHeader>
            <div className="py-6">
              {currentQuestion.type === "radio" ? (
                <RadioGroup
                  onValueChange={(value: string) =>
                    setAnswers({ ...answers, [step]: value })
                  }
                  value={answers[step] as string}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={option.text}
                      className={`relative flex items-center p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                        answers[step] === option.text
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem 
                        value={option.text} 
                        id={`q${step}_${option.text}`}
                        className="shrink-0"
                      />
                      <Label 
                        htmlFor={`q${step}_${option.text}`} 
                        className="flex-1 ml-4 text-base font-medium cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.text}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    복수 선택 가능
                  </p>
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={option.text}
                      className={`relative flex items-center p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                        ((answers[step] as string[]) || []).includes(option.text)
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        id={`q${step}_${option.text}`}
                        checked={((answers[step] as string[]) || []).includes(
                          option.text
                        )}
                        onCheckedChange={(checked: boolean) =>
                          handleCheckboxChange(checked, option.text)
                        }
                        className="shrink-0"
                      />
                      <Label 
                        htmlFor={`q${step}_${option.text}`} 
                        className="flex-1 ml-4 text-base font-medium cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.text}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="pt-6">
              <Button 
                onClick={handleNext}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
                disabled={
                  currentQuestion.type === "radio" 
                    ? !answers[step] 
                    : !answers[step] || (answers[step] as string[]).length === 0
                }
              >
                {step === surveyQuestions.length - 1 ? "결과 확인하기" : "다음"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="text-center space-y-6">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <DialogTitle className="text-2xl font-bold">
                  <div className="flex flex-wrap items-baseline justify-center gap-2">
                    <span className="text-gray-600 text-base font-normal">
                      <span className="font-bold">{userName}</span>님의 투자자 성향은
                    </span>
                    <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent text-3xl font-bold">
                      {resultType.name}
                    </span>
                    <span className="text-lg font-normal text-gray-700">이에요!</span>
                  </div>
                </DialogTitle>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{getValidUntilDate()}까지 유효해요</span>
                </p>
              </div>
            </DialogHeader>

            <div className="py-6 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h4 className="text-center font-bold text-lg mb-4 text-gray-800 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  내 투자성향 분석
                </h4>
                
                {/* 개선된 투자성향 바 */}
                <div className="space-y-3">
                  <div className="flex w-full h-6 rounded-full overflow-hidden shadow-inner bg-gray-100">
                    {investmentTypes.map((type, i) => (
                      <div 
                        key={i} 
                        className={`w-1/5 ${type.color} transition-all duration-500 hover:brightness-110 ${
                          type.name === resultType.name ? 'shadow-lg ring-2 ring-white' : ''
                        }`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  
                  {/* 투자성향 라벨 */}
                  <div className="relative w-full">
                    {investmentTypes.map((type, i) => (
                      <div
                        key={type.name}
                        className={`absolute top-0 text-xs text-center w-1/5 transition-all duration-300 ${
                          type.name === resultType.name 
                            ? "font-bold text-emerald-600 transform scale-110" 
                            : "text-gray-500"
                        }`}
                        style={{ left: `${i * 20}%` }}
                      >
                        <div className="flex flex-col items-center">
                          <span>{type.name.slice(0, 2)}</span>
                          {type.name === resultType.name && (
                            <div className="w-2 h-2 bg-emerald-600 rounded-full mt-1 animate-bounce" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  등록된 투자자 성향 정보는 <span className="font-semibold text-emerald-600">2년 동안</span> 유효해요
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={handleClose}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
              >
                완료
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
