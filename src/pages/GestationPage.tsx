import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Info, RotateCcw, Printer, Pencil } from "lucide-react";
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
  breakfastDose: string;
  lunchDose: string;
  dinnerDose: string;
  prandialBG: string;
  prandialHypo: string;
  prandialBG1: string;
  prandialBG2: string;
  prandialBG3: string;
  prandialBG4: string;
  correctionDose: string;
}

const initialForm: FormData = {
  basalDose: "",
  fastingBG: "",
  basalHypo: "no",
  basalBG1: "",
  basalBG2: "",
  basalBG3: "",
  basalBG4: "",
  usingPrandial: "no",
  breakfastDose: "",
  lunchDose: "",
  dinnerDose: "",
  prandialBG: "",
  prandialHypo: "no",
  prandialBG1: "",
  prandialBG2: "",
  prandialBG3: "",
  prandialBG4: "",
  correctionDose: "",
};

/* ── Page Component ── */

const GestationPage = () => {
  const navigate = useNavigate();
  const { firstName } = useProfile();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({ ...initialForm });
  const [result, setResult] = useState<Record<string, string> | null>(null);

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
      if (!form.breakfastDose && !form.lunchDose && !form.dinnerDose) {
        toast({ title: "Invalid Prandial Doses", description: "Please enter at least one meal dose.", variant: "destructive" });
        return;
      }
      if (!form.prandialBG || parseFloat(form.prandialBG) <= 0) {
        toast({ title: "Invalid Prandial BG", description: "Please enter a valid prandial blood glucose.", variant: "destructive" });
        return;
      }
    }

    // Placeholder — will be replaced with real logic
    setResult({ placeholder: "true" });
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleEditInputs = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFreshStart = () => {
    setForm({ ...initialForm });
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
        <h2 className="text-xl font-extrabold text-foreground">Welcome to DiaForm Gestation Insulin Dosage</h2>
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

          <AnimatePresence>
            {form.basalHypo === "yes" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <BGValuesGroup
                  label="What are the Blood Glucose (BG) Values"
                  values={[form.basalBG1, form.basalBG2, form.basalBG3, form.basalBG4]}
                  placeholders={["ex: 68", "ex: 69", "ex: 67", "ex: 66"]}
                  onChange={(i, v) => update(`basalBG${i + 1}` as keyof FormData, v)}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
                <FieldGroup label="Breakfast insulin dose per meal (units)">
                  <Input type="number" placeholder="ex: 1" value={form.breakfastDose} onChange={(e) => update("breakfastDose", e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Lunch insulin dose per meal (units)">
                  <Input type="number" placeholder="ex: 2" value={form.lunchDose} onChange={(e) => update("lunchDose", e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Dinner insulin dose per meal (units)">
                  <Input type="number" placeholder="ex: 3" value={form.dinnerDose} onChange={(e) => update("dinnerDose", e.target.value)} />
                </FieldGroup>

                <FieldGroup label="Prandial Blood Glucose (PBG), mg/dL">
                  <Input type="number" placeholder="ex: 130" value={form.prandialBG} onChange={(e) => update("prandialBG", e.target.value)} />
                </FieldGroup>

                <div className="pt-1">
                  <RadioField
                    label="Has patient experienced 2 or more episodes of hypoglycemia (blood glucose < 70) in the last 3 months?"
                    options={["Yes", "No"]}
                    value={form.prandialHypo}
                    onChange={(v) => update("prandialHypo", v)}
                  />
                </div>

                <AnimatePresence>
                  {form.prandialHypo === "yes" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <BGValuesGroup
                        label="What are the Blood Glucose (BG) Values"
                        values={[form.prandialBG1, form.prandialBG2, form.prandialBG3, form.prandialBG4]}
                        placeholders={["ex: 69", "ex: 68", "ex: 66", "ex: 65"]}
                        onChange={(i, v) => update(`prandialBG${i + 1}` as keyof FormData, v)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
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

      {/* Results (placeholder) */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-5 mt-6 space-y-5"
          >
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
              <h3 className="text-lg font-extrabold text-foreground mb-4">
                Recommended Adjustments to Basal and/or Prandial Insulin Doses
              </h3>
              <div className="rounded-xl bg-primary/10 p-4 text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-1">Calculation logic pending</p>
                <p className="text-base font-extrabold text-primary">
                  Results will appear here once logic is provided.
                </p>
              </div>
            </div>

            {/* Submitted Inputs */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-extrabold text-foreground mb-4">Submitted Inputs</h3>
              <div className="space-y-3">
                <ResultRow label="Basal Dose (BD)" value={`${form.basalDose} units`} />
                <ResultRow label="Fasting Blood Glucose" value={`${form.fastingBG} mg/dL`} />
                <ResultRow label="Basal Hypoglycemia Episodes" value={form.basalHypo === "yes" ? "Yes" : "No"} />
                {form.basalHypo === "yes" && (
                  <ResultRow label="Basal BG Values" value={[form.basalBG1, form.basalBG2, form.basalBG3, form.basalBG4].filter(Boolean).join(", ") || "—"} />
                )}
                <ResultRow label="Using Prandial" value={form.usingPrandial === "yes" ? "Yes" : "No"} />
                {form.usingPrandial === "yes" && (
                  <>
                    <ResultRow label="Breakfast Dose" value={`${form.breakfastDose || "—"} units`} />
                    <ResultRow label="Lunch Dose" value={`${form.lunchDose || "—"} units`} />
                    <ResultRow label="Dinner Dose" value={`${form.dinnerDose || "—"} units`} />
                    <ResultRow label="Prandial Blood Glucose" value={`${form.prandialBG} mg/dL`} />
                    <ResultRow label="Prandial Hypoglycemia" value={form.prandialHypo === "yes" ? "Yes" : "No"} />
                    {form.prandialHypo === "yes" && (
                      <ResultRow label="Prandial BG Values" value={[form.prandialBG1, form.prandialBG2, form.prandialBG3, form.prandialBG4].filter(Boolean).join(", ") || "—"} />
                    )}
                  </>
                )}
                <ResultRow label="Correction Dose (CTD)" value={form.correctionDose ? `${form.correctionDose} units` : "—"} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleEditInputs} variant="outline" className="flex-1 h-12 rounded-xl font-bold gap-2">
                <Pencil className="h-4 w-4" />
                Edit Inputs
              </Button>
              <Button onClick={handleFreshStart} variant="outline" className="flex-1 h-12 rounded-xl font-bold gap-2">
                <RotateCcw className="h-4 w-4" />
                Fresh Start
              </Button>
            </div>
            <Button onClick={() => window.print()} className="w-full h-12 rounded-xl font-bold gap-2">
              <Printer className="h-4 w-4" />
              Print Results
            </Button>
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

export default GestationPage;
