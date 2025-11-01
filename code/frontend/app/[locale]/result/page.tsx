"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PredictResp = {
  status?: string;
  decision?: string;
  reason?: string;
  prediction_output?: {
    predicted_price: number;
    base_price: number;
    adjustment_percentage: number;
    adjustment_chf: number;
  };
  reasoning_advanced?: {
    explanation?: string;
  };
};

export default function ResultPage() {
  const [result, setResult] = useState<PredictResp | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Simulated data for demonstration
    const mockData = {
      status: "success",
      decision: "accepted with extra charge",
      reason: "Smoker without physical activity → higher premium",
      prediction_output: {
        predicted_price: 693.34,
        base_price: 564.33,
        adjustment_percentage: 22.86,
        adjustment_chf: 129.01
      },
      reasoning_advanced: {
        explanation:
          "Accepted with extra charge: the applicant's smoking habit and lack of regular physical activity significantly increase risk, despite a healthy BMI and young age."
      }
    };
    setResult(mockData);

    // uncomment!!
    /* const raw = sessionStorage.getItem("pax_predict_result");
    if (raw) {
      try {
        console.log(JSON.parse(raw));
        setResult(JSON.parse(raw));
      } catch {
        setResult({ status: "error", reason: "Invalid result" });
      }
    } */
  }, []);

  const getDecisionColor = (decision?: string) => {
    if (!decision) return "text-gray-700";
    const lower = decision.toLowerCase();
    if (lower.includes("accepted") && !lower.includes("extra")) return "text-[#a5c405]";
    if (lower.includes("extra charge")) return "text-[#a5c405]";
    if (lower.includes("rejected")) return "text-red-600";
    return "text-[#413c59]";
  };

  const getDecisionIcon = (decision?: string) => {
    if (!decision) return "ℹ️";
    const lower = decision.toLowerCase();
    if (lower.includes("accepted") && !lower.includes("extra")) return "✓";
    if (lower.includes("extra charge")) return "⚠";
    if (lower.includes("rejected")) return "✗";
    return "ℹ️";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f8f9fa] via-[#413c59]/5 to-[#a5c405]/5">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#413c59]/10">
          {/* Header */}
          <div className="bg-[#413c59] px-8 py-5">
            <h1 className="text-2xl font-bold text-white text-center">
              Application Result
            </h1>
          </div>

          {result ? (
            <div className="p-6 space-y-5">
              {/* Decision */}
              <div className="text-center space-y-2 py-3">
                <div className={`text-4xl ${getDecisionColor(result.decision)}`}>
                  {getDecisionIcon(result.decision)}
                </div>
                <div>
                  <p className="text-xs text-[#413c59]/60 uppercase tracking-wide font-medium mb-1">
                    Decision
                  </p>
                  <p className={`text-lg font-bold ${getDecisionColor(result.decision)}`}>
                    {result.decision ?? "—"}
                  </p>
                </div>
              </div>

              {/* Reason */}
              {result.reason && (
                <div className="bg-[#413c59]/5 rounded-xl p-4 border border-[#413c59]/20">
                  <p className="text-xs text-[#413c59] uppercase tracking-wide font-medium mb-1.5 text-center">
                    Reason
                  </p>
                  <p className="text-gray-700 text-center font-medium text-sm">
                    {result.reason}
                  </p>
                </div>
              )}

              {/* Premium Adjustment */}
              {result.prediction_output &&
                result.prediction_output.adjustment_percentage > 0 && (
                  <div className="bg-gradient-to-br from-[#a5c405]/10 to-[#413c59]/10 rounded-xl p-5 border-2 border-[#a5c405]/30">
                    <p className="text-xs text-[#413c59] uppercase tracking-wide font-semibold mb-3 text-center">
                      Premium Adjustment
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Base Price</p>
                        <p className="text-lg font-bold text-gray-700">
                          CHF{result.prediction_output.base_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Final Price</p>
                        <p className="text-lg font-bold text-[#a5c405]">
                          CHF{result.prediction_output.predicted_price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#a5c405]/30">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium text-sm">
                          Additional Charge:
                        </span>
                        <div className="text-right">
                          <span className="text-base font-bold text-[#a5c405]">
                            +CHF{result.prediction_output.adjustment_chf.toFixed(2)}
                          </span>
                          <span className="text-xs text-[#413c59] ml-2 font-bold">
                            (+{result.prediction_output.adjustment_percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Explanation */}
              {result.reasoning_advanced?.explanation && (
                <div className="bg-[#413c59]/5 rounded-xl p-4 border border-[#413c59]/20">
                  <p className="text-xs text-[#413c59] uppercase tracking-wide font-medium mb-2">
                    Detailed Explanation
                  </p>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {result.reasoning_advanced.explanation.replace(/^"|"$/g, "")}
                  </p>
                </div>
              )}

              {/* Back Button */}
              <div className="pt-3">
                <button className="w-full bg-[#a5c405] hover:from-[#524d6e] hover:to-[#8fb204] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  onClick={() => router.push(`/`)}>
                  Back to Start
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-base">
                No result found. Please submit the form first.
              </p>
              <button className="mt-6 bg-gradient-to-r from-[#413c59] to-[#a5c405] hover:from-[#524d6e] hover:to-[#8fb204] text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300">
                Go to Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}