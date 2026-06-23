import { iconOptions, IconByName } from "./registry";
import styles from "./icon-picker.module.css";

interface IconPickerProps {
  /** Submitted form field name (e.g. "avatar" or "emoji"). */
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string;
}

/**
 * Accessible icon chooser: a native radio group rendered as a grid of Lucide
 * icons. Native radios give keyboard navigation (arrow keys) and submit the
 * chosen key for free; each option carries an sr-only text label.
 */
export function IconPicker({
  name,
  label,
  options,
  defaultValue,
}: IconPickerProps) {
  const opts = iconOptions(options);
  const selected =
    defaultValue && options.includes(defaultValue)
      ? defaultValue
      : opts[0]?.key;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.grid}>
        {opts.map(({ key, label: optionLabel }) => (
          <label key={key} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={key}
              defaultChecked={key === selected}
              className={styles.input}
              aria-label={optionLabel}
            />
            <span className={styles.swatch}>
              <IconByName name={key} size={24} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
