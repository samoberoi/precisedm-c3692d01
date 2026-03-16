import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Info, RotateCcw, Printer } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

/* ── Types ── */

interface FormData {
  basalDose: string;
  fastingBG: string;
  basalHypo: string;
  basalBG1: string;
  basalBG2: string;
  basalBG3: string;
  basalBG4: string;
  usingPrandial: string;
  prandialDose: string;
  prandialBG: string;
  prandialHypo: string;
  prandialBG1: string;
  prandialBG2: string;
  prandialBG3: string;
  prandialBG4: string;
  correctionDose: string;
}

interface CalcResult {
  basalRecommendation: string;
  basalNewDose: number | null;
  prandialRecommendation: string | null;
  prandialNewDose: number | null;
  correctionRecommendation: string | null;
  inputs: FormData;
}

/* ── Calculation Logic ── */

function calculateMaintenance(form: FormData): CalcResult {
  const bd = parseFloat(form.basalDose);
  const fbg = parseFloat(form.fastingBG);
  const basalHypo = form.basalHypo === "yes";
  const bg1 = parseFloat(form.basalBG1);
  const bg2 = parseFloat(form.basalBG2);
  const bg3 = parseFloat(form.basalBG3);
  const bg4 = parseFloat(form.basalBG4);

  // Basal Insulin adjustment
  let basalRecommendation: string;
  let basalNewDose: number | null = null;

  if (basalHypo) {
    // If hypoglycemia episodes, check BG values
    const bgValues = [bg1, bg2, bg3, bg4].filter((v) => !isNaN(v));
    const anyBelow70 = bgValues.some((v) => v < 70);
    if (anyBelow70) {
      basalNewDose = Math.round(bd * 0.8); // reduce by 20%
      basalRecommendation = `Reduce basal dose by 20%. New recommended dose: ${basalNewDose} units/day`;
    } else {
      basalRecommendation = "Hypoglycemia reported but BG values ≥ 70. Maintain current basal dose and monitor closely.";
      basalNewDose = bd;
    }
  } else if (fbg > 180) {
    basalNewDose = Math.round(bd * 1.2); // increase by 20%
    basalRecommendation = `Fasting BG > 180. Increase basal dose by 20%. New recommended dose: ${basalNewDose} units/day`;
  } else if (fbg > 130) {
    basalNewDose = Math.round(bd * 1.1); // increase by 10%
    basalRecommendation = `Fasting BG 131–180. Increase basal dose by 10%. New recommended dose: ${basalNewDose} units/day`;
  } else if (fbg >= 70) {
    basalRecommendation = "Fasting BG is at goal (70–130). Maintain current basal dose.";
    basalNewDose = bd;
  } else {
    basalNewDose = Math.round(bd * 0.8);
    basalRecommendation = `Fasting BG < 70. Reduce basal dose by 20%. New recommended dose: ${basalNewDose} units/day`;
  }

  // Prandial Insulin adjustment
  let prandialRecommendation: string | null = null;
  let prandialNewDose: number | null = null;

  if (form.usingPrandial === "yes") {
    const pd = parseFloat(form.prandialDose);
    const pbg = parseFloat(form.prandialBG);
    const prandialHypo = form.prandialHypo === "yes";
    const pBG1 = parseFloat(form.prandialBG1);
    const pBG2 = parseFloat(form.prandialBG2);
    const pBG3 = parseFloat(form.prandialBG3);
    const pBG4 = parseFloat(form.prandialBG4);

    if (prandialHypo) {
      const pBGValues = [pBG1, pBG2, pBG3, pBG4].filter((v) => !isNaN(v));
      const pAnyBelow70 = pBGValues.some((v) => v < 70);
      if (pAnyBelow70) {
        prandialNewDose = Math.round(pd * 0.8);
        prandialRecommendation = `Reduce prandial dose by 20%. New recommended dose: ${prandialNewDose} units/meal`;
      } else {
        prandialRecommendation = "Hypoglycemia reported but BG values ≥ 70. Maintain current prandial dose and monitor.";
        prandialNewDose = pd;
      }
    } else if (pbg > 180) {
      prandialNewDose = Math.round(pd * 1.2);
      prandialRecommendation = `Prandial BG > 180. Increase prandial dose by 20%. New recommended dose: ${prandialNewDose} units/meal`;
    } else if (pbg > 130) {
      prandialNewDose = Math.round(pd * 1.1);
      prandialRecommendation = `Prandial BG 131–180. Increase prandial dose by 10%. New recommended dose: ${prandialNewDose} units/meal`;
    } else if (pbg >= 70) {
      prandialRecommendation = "Prandial BG is at goal (70–130). Maintain current prandial dose.";
      prandialNewDose = pd;
    } else {
      prandialNewDose = Math.round(pd * 0.8);
      prandialRecommendation = `Prandial BG < 70. Reduce prandial dose by 20%. New recommended dose: ${prandialNewDose} units/meal`;
    }
  }

  // Correction dose — display as submitted
  const ctd = parseFloat(form.correctionDose);
  const correctionRecommendation = !isNaN(ctd)
    ? `Current correction dose: ${ctd} units/day. Review and adjust as needed based on BG trends.`
    : null;

  return {
    basalRecommendation,
    basalNewDose,
    prandialRecommendation,
    prandialNewDose,
    correctionRecommendation,
    inputs: form,
  };
}

/* ── Page Component ── */

const MaintenancePage = () => {
  const navigate = useNavigate();
  const { firstName } = useProfile();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    basalDose: "",
    fastingBG: "",
    basalHypo: "no",
    basalBG1: "",
    basalBG2: "",
    basalBG3: "",
    basalBG4: "",
    usingPrandial: "no",
    prandialDose: "",
    prandialBG: "",
    prandialHypo: "no",
    prandialBG1: "",
    prandialBG2: "",
    prandialBG3: "",
    prandialBG4: "",
    correctionDose: "",
  });

  const [result, setResult] = useState<CalcResult | null>(null);

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = () => {
    if (!form.basalDose || parseFloat(form.basalDose) <= 0) {
      toast({ title: "Invalid Basal Dose", description: "Please enter a valid basal insulin dose.", variant: "destructive" });
      return;
    }
    if (!form.fastingBG || parseFloat(form.fastingBG) <= 0) {
      toast({ title: "Invalid Fasting BG", description: "Please enter a valid fasting blood glucose.", variant: "destructive" });
      return;
    }
    if (form.usingPrandial === "yes") {
      if (!form.prandialDose || parseFloat(form.prandialDose) <= 0) {
        toast({ title: "Invalid Prandial Dose", description: "Please enter a valid prandial dose.", variant: "destructive" });
        return;
      }
      if (!form.prandialBG || parseFloat(form.prandialBG) <= 0) {
        toast({ title: "Invalid Prandial BG", description: "Please enter a valid prandial blood glucose.", variant: "destructive" });
        return;
      }
    }

    const res = calculateMaintenance(form);
    setResult(res);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleStartOver = () => {
    setForm({
      basalDose: "",
      fastingBG: "",
      basalHypo: "no",
      basalBG1: "",
      basalBG2: "",
      basalBG3: "",
      basalBG4: "",
      usingPrandial: "no",
      prandialDose: "",
      prandialBG: "",
      prandialHypo: "no",
      prandialBG1: "",
      prandialBG2: "",
      prandialBG3: "",
      prandialBG4: "",
      correctionDose: "",
    });
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-foreground mb-3">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Hello !!</p>
            <h1 className="text-2xl font-bold text-foreground">{firstName}</h1>
          </div>
          <button
            onClick={() => navigate("/disclaimer")}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-border"
          >
            <Info className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 mt-5 mb-2 text-center">
        <h2 className="text-xl font-extrabold text-foreground">Welcome to DiaForm Maintenance Insulin Dosage</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This tool calculates the adjustments to Basal and/or Prandial insulin doses.
        </p>
      </motion.div>

      {/* Form */}
      {!result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mx-5 mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-6"
        >
          {/* Basal Section */}
          <FieldGroup label="Basal insulin dose per day (BD), units">
            <Input type="number" placeholder="ex: 10" value={form.basalDose} onChange={(e) => update("basalDose", e.target.value)} />
          </FieldGroup>

          <FieldGroup label="Fasting Blood Glucose (FBG), mg/dL">
            <Input type="number" placeholder="ex: 90" value={form.fastingBG} onChange={(e) => update("fastingBG", e.target.value)} />
          </FieldGroup>

          <div className="pt-1">
            <p className="text-base font-bold text-foreground mb-2">Basal Insulin</p>
            <RadioField
              label="Has patient experienced 2 or more episodes of hypoglycemia (blood glucose < 70) in the last 3 months?"
              options={["Yes", "No"]}
              value={form.basalHypo}
              onChange={(v) => update("basalHypo", v)}
            />
          </div>

          <BGValuesGroup
            label="What are the Blood Glucose (BG) Values"
            values={[form.basalBG1, form.basalBG2, form.basalBG3, form.basalBG4]}
            placeholders={["ex: 68", "ex: 69", "ex: 67", "ex: 66"]}
            onChange={(i, v) => update((`basalBG${i + 1}` as keyof FormData), v)}
          />

          {/* Prandial Section */}
          <RadioField
            label="Using Prandial?"
            options={["Yes", "No"]}
            value={form.usingPrandial}
            onChange={(v) => update("usingPrandial", v)}
          />

          <AnimatePresence>
            {form.usingPrandial === "yes" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <FieldGroup label="Prandial insulin dose per meal (PD), units">
                  <Input type="number" placeholder="ex: 3" value={form.prandialDose} onChange={(e) => update("prandialDose", e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Prandial Blood Glucose (PBG), mg/dL">
                  <Input type="number" placeholder="ex: 130" value={form.prandialBG} onChange={(e) => update("prandialBG", e.target.value)} />
                </FieldGroup>

                <div className="pt-1">
                  <p className="text-base font-bold text-foreground mb-2">Prandial Insulin</p>
                  <RadioField
                    label="Has patient experienced more than 3 episodes of hypoglycemia (blood glucose < 70) in the last 3 months?"
                    options={["Yes", "No"]}
                    value={form.prandialHypo}
                    onChange={(v) => update("prandialHypo", v)}
                  />
                </div>

                <BGValuesGroup
                  label="What are the Blood Glucose (BG) Values"
                  values={[form.prandialBG1, form.prandialBG2, form.prandialBG3, form.prandialBG4]}
                  placeholders={["ex: 69", "ex: 68", "ex: 66", "ex: 65"]}
                  onChange={(i, v) => update((`prandialBG${i + 1}` as keyof FormData), v)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Correction Dose */}
          <FieldGroup label="Correction insulin dose per day (CTD), units">
            <Input type="number" placeholder="ex: 19" value={form.correctionDose} onChange={(e) => update("correctionDose", e.target.value)} />
          </FieldGroup>

          <Button onClick={handleCalculate} className="w-full h-12 text-base font-bold rounded-xl mt-2">
            Calculate
          </Button>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-5 mt-6 space-y-5"
          >
            {/* Basal Recommendation */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
              <h3 className="text-lg font-extrabold text-foreground mb-3">Basal Insulin Recommendation</h3>
              {result.basalNewDose !== null && (
                <div className="rounded-xl bg-primary/10 p-4 text-center mb-3">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Recommended Basal Dose</p>
                  <p className="text-3xl font-extrabold text-primary">{result.basalNewDose}</p>
                  <p className="text-sm font-bold text-primary/80">units/day</p>
                </div>
              )}
              <p className="text-sm text-foreground leading-relaxed">{result.basalRecommendation}</p>
            </div>

            {/* Prandial Recommendation */}
            {result.prandialRecommendation && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-foreground mb-3">Prandial Insulin Recommendation</h3>
                {result.prandialNewDose !== null && (
                  <div className="rounded-xl bg-primary/10 p-4 text-center mb-3">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Recommended Prandial Dose</p>
                    <p className="text-3xl font-extrabold text-primary">{result.prandialNewDose}</p>
                    <p className="text-sm font-bold text-primary/80">units/meal</p>
                  </div>
                )}
                <p className="text-sm text-foreground leading-relaxed">{result.prandialRecommendation}</p>
              </div>
            )}

            {/* Correction Dose */}
            {result.correctionRecommendation && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-foreground mb-3">Correction Insulin</h3>
                <p className="text-sm text-foreground leading-relaxed">{result.correctionRecommendation}</p>
              </div>
            )}

            {/* Submitted Inputs */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-extrabold text-foreground mb-4">Submitted Inputs</h3>
              <div className="space-y-3">
                <ResultRow label="Basal Dose (BD)" value={`${result.inputs.basalDose} units`} />
                <ResultRow label="Fasting BG" value={`${result.inputs.fastingBG} mg/dL`} />
                <ResultRow label="Basal Hypoglycemia" value={result.inputs.basalHypo === "yes" ? "Yes" : "No"} />
                {result.inputs.basalBG1 && <ResultRow label="Basal BG Values" value={[result.inputs.basalBG1, result.inputs.basalBG2, result.inputs.basalBG3, result.inputs.basalBG4].filter(Boolean).join(", ")} />}
                <ResultRow label="Using Prandial" value={result.inputs.usingPrandial === "yes" ? "Yes" : "No"} />
                {result.inputs.usingPrandial === "yes" && (
                  <>
                    <ResultRow label="Prandial Dose (PD)" value={`${result.inputs.prandialDose} units`} />
                    <ResultRow label="Prandial BG" value={`${result.inputs.prandialBG} mg/dL`} />
                    <ResultRow label="Prandial Hypoglycemia" value={result.inputs.prandialHypo === "yes" ? "Yes" : "No"} />
                    {result.inputs.prandialBG1 && <ResultRow label="Prandial BG Values" value={[result.inputs.prandialBG1, result.inputs.prandialBG2, result.inputs.prandialBG3, result.inputs.prandialBG4].filter(Boolean).join(", ")} />}
                  </>
                )}
                {result.inputs.correctionDose && <ResultRow label="Correction Dose (CTD)" value={`${result.inputs.correctionDose} units`} />}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleStartOver} variant="outline" className="flex-1 h-12 rounded-xl font-bold gap-2">
                <RotateCcw className="h-4 w-4" />
                Start Over
              </Button>
              <Button onClick={() => window.print()} className="flex-1 h-12 rounded-xl font-bold gap-2">
                <Printer className="h-4 w-4" />
                Print Results
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

/* ── Reusable sub-components ── */

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-sm font-semibold text-foreground mb-2 block">{label}</Label>
    {children}
  </div>
);

const RadioField = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label className="text-sm font-semibold text-foreground mb-2 block">{label}</Label>
    <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
      {options.map((opt) => {
        const val = opt.toLowerCase();
        return (
          <label
            key={opt}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
              value === val ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <RadioGroupItem value={val} />
            <span className="text-sm font-medium text-foreground">{opt}</span>
          </label>
        );
      })}
    </RadioGroup>
  </div>
);

const BGValuesGroup = ({
  label,
  values,
  placeholders,
  onChange,
}: {
  label: string;
  values: string[];
  placeholders: string[];
  onChange: (index: number, value: string) => void;
}) => (
  <div>
    <Label className="text-sm font-semibold text-foreground mb-3 block">{label}</Label>
    <div className="space-y-3 pl-4">
      {["BG1", "BG2", "BG3", "BG4"].map((bgLabel, i) => (
        <div key={bgLabel} className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground w-10">{bgLabel}</span>
          <Input
            type="number"
            placeholder={placeholders[i]}
            value={values[i]}
            onChange={(e) => onChange(i, e.target.value)}
            className="flex-1"
          />
        </div>
      ))}
    </div>
  </div>
);

const ResultRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-sm font-bold text-foreground text-right">{value}</span>
  </div>
);

export default MaintenancePage;
