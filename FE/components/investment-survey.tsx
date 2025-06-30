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
      { text: "펀드(채권형)", score: 2 },
      { text: "펀드(주식형)", score: 3 },
      { text: "펀드(혼합형)", score: 3 },
      { text: "주식", score: 4 },
      { text: "레버리지 및 인버스 ETF", score: 5 },
      { text: "주식 신용거래", score: 5 },
      { text: "선물, 옵션", score: 6 },
      { text: "ELB", score: 2 },
      { text: "ELS(원금부분지급형)", score: 4 },
      { text: "ELS(원금비보장)", score: 5 },
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
  { name: "안정형", color: "bg-teal-500" },
  { name: "안정추구형", color: "bg-green-500" },
  { name: "위험중립형", color: "bg-yellow-500" },
  { name: "적극투자형", color: "bg-orange-500" },
  { name: "공격투자형", color: "bg-red-500" },
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

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await getMyInfo();
        setUserName(userInfo.name);
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
            <DialogHeader>
              <DialogTitle>
                <span className="text-primary font-bold">{step + 1}</span>/
                {surveyQuestions.length}
              </DialogTitle>
              <p className="text-lg font-semibold pt-2">
                {currentQuestion.question}
              </p>
            </DialogHeader>
            <div className="py-4">
              {currentQuestion.type === "radio" ? (
                <RadioGroup
                  onValueChange={(value: string) =>
                    setAnswers({ ...answers, [step]: value })
                  }
                  value={answers[step] as string}
                >
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.text}
                      className="flex items-center space-x-2 py-2"
                    >
                      <RadioGroupItem value={option.text} id={option.text} />
                      <Label htmlFor={option.text} className="text-base">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.text}
                      className="flex items-center space-x-2 py-2"
                    >
                      <Checkbox
                        id={option.text}
                        checked={((answers[step] as string[]) || []).includes(
                          option.text
                        )}
                        onCheckedChange={(checked: boolean) =>
                          handleCheckboxChange(checked, option.text)
                        }
                      />
                      <Label htmlFor={option.text} className="text-base">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleNext}>확인</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {userName}님의 투자자 성향은
                <br />
                <span className="text-primary">{resultType.name}</span>이에요
              </DialogTitle>
              <p className="text-center text-xs text-gray-500 pt-2">
                2027년 6월 27일까지 유효해요.
              </p>
            </DialogHeader>
            <div className="py-4 text-center text-sm">
              <p>등록된 투자자 성향 정보는 2년 동안 유효해요.</p>
            </div>
            <div className="my-4">
              <h4 className="text-center font-semibold mb-2">내 투자성향</h4>
              <div className="flex w-full h-3 rounded-full overflow-hidden">
                {investmentTypes.map((type, i) => (
                  <div key={i} className={`w-1/5 ${type.color}`} />
                ))}
              </div>
              <div className="relative w-full h-4">
                {investmentTypes.map((type, i) => (
                  <div
                    key={type.name}
                    className={`absolute top-0 text-xs text-center w-1/5 ${
                      type.name === resultType.name ? "font-bold" : ""
                    }`}
                    style={{ left: `${i * 20}%` }}
                  >
                    {type.name.slice(0, 2)}
                    {type.name === resultType.name && (
                      <div className="w-1 h-1 bg-black rounded-full mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button onClick={handleClose}>다음</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
