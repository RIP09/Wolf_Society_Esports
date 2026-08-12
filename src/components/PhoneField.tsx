import { OptionPicker } from "@/components/GamePicker";
import { Input } from "@/components/ui/input";
import { DIAL_CODE_OPTIONS, dialFromOption } from "@/lib/constants";
import { input } from "@/lib/neo";

/**
 * Phone input with a worldwide country-code picker (e.g. "+91 India").
 * `dialCode` is stored separately from the local number so SMS alerts can
 * always use the correct country code.
 */
export function PhoneField({
  dialCode,
  localNumber,
  onDialChange,
  onLocalChange,
}: {
  dialCode: string; // e.g. "+91"
  localNumber: string; // e.g. "98765 43210"
  onDialChange: (dial: string) => void;
  onLocalChange: (number: string) => void;
}) {
  const optionValue =
    DIAL_CODE_OPTIONS.find((o) => dialFromOption(o) === dialCode) ?? dialCode;

  return (
    <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
      <OptionPicker
        options={DIAL_CODE_OPTIONS}
        value={optionValue}
        onChange={(o) => onDialChange(dialFromOption(o))}
        placeholder="Country code"
        searchPlaceholder="Search country…"
        notSureLabel={dialCode || "+1"}
        emptyText="No country found."
      />
      <Input
        className={input}
        type="tel"
        inputMode="tel"
        value={localNumber}
        onChange={(e) => onLocalChange(e.target.value.replace(/[^\d\s]/g, ""))}
        placeholder="Your number, e.g. 98765 43210"
      />
    </div>
  );
}
