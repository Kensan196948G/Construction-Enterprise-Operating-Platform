import { useForm, type DefaultValues, type SubmitHandler, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodTypeAny, z } from 'zod';
import { cn } from '../utils/cn';

export type FormFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';

export interface FormFieldOption {
  label: string;
  value: string | number;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: FormFieldOption[]; // select 用
  rows?: number; // textarea 用
  accept?: string; // file 用
  multiple?: boolean; // file 用
  step?: number | string; // number 用
  min?: number | string;
  max?: number | string;
  disabled?: boolean;
}

export interface FormBuilderProps<S extends ZodTypeAny> {
  /** zod スキーマ (resolver にも使用) */
  schema: S;
  /** フィールド定義配列 */
  fields: FormField[];
  /** 初期値 */
  defaultValues?: DefaultValues<z.infer<S>>;
  /** 送信ハンドラ */
  onSubmit: SubmitHandler<z.infer<S>>;
  /** 送信ボタンラベル */
  submitLabel?: string;
  /** リセットボタンを表示するか */
  showReset?: boolean;
  /** 追加クラス */
  className?: string;
}

/**
 * react-hook-form + zod による動的フォーム生成。
 * - 対応タイプ: text / number / date / select / textarea / file
 */
export function FormBuilder<S extends ZodTypeAny>(props: FormBuilderProps<S>): JSX.Element {
  const {
    schema,
    fields,
    defaultValues,
    onSubmit,
    submitLabel = '送信',
    showReset = false,
    className,
  } = props;

  type Values = z.infer<S> & FieldValues;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
      aria-label="フォーム"
    >
      {fields.map((field) => {
        const fieldError = (errors as Record<string, { message?: string } | undefined>)[field.name];
        const errorId = `${field.name}-error`;
        const descId = `${field.name}-desc`;
        const commonAria = {
          'aria-invalid': !!fieldError,
          'aria-describedby': [field.description ? descId : null, fieldError ? errorId : null]
            .filter(Boolean)
            .join(' ') || undefined,
        };

        return (
          <div key={field.name} className="flex flex-col gap-1">
            <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
            </label>

            {field.description && (
              <p id={descId} className="text-xs text-slate-500">
                {field.description}
              </p>
            )}

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                rows={field.rows ?? 3}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className={cn('cdx-input', fieldError && 'border-danger focus:border-danger')}
                {...commonAria}
                {...register(field.name as never)}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                disabled={field.disabled}
                className={cn('cdx-input', fieldError && 'border-danger focus:border-danger')}
                {...commonAria}
                {...register(field.name as never)}
              >
                <option value="">{field.placeholder ?? '選択してください'}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'file' ? (
              <input
                id={field.name}
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                disabled={field.disabled}
                className={cn(
                  'block w-full text-sm text-slate-700',
                  'file:mr-3 file:py-2 file:px-3 file:rounded file:border-0',
                  'file:bg-primary file:text-white hover:file:bg-primary-600',
                )}
                {...commonAria}
                {...register(field.name as never)}
              />
            ) : (
              <input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                disabled={field.disabled}
                step={field.step}
                min={field.min}
                max={field.max}
                className={cn('cdx-input', fieldError && 'border-danger focus:border-danger')}
                {...commonAria}
                {...register(field.name as never, {
                  valueAsNumber: field.type === 'number',
                })}
              />
            )}

            {fieldError?.message && (
              <p id={errorId} role="alert" className="text-xs text-danger">
                {String(fieldError.message)}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex gap-2 pt-2">
        <button type="submit" className="cdx-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '送信中...' : submitLabel}
        </button>
        {showReset && (
          <button
            type="button"
            onClick={() => reset()}
            className="cdx-btn bg-slate-200 text-slate-800 hover:bg-slate-300"
          >
            リセット
          </button>
        )}
      </div>
    </form>
  );
}
