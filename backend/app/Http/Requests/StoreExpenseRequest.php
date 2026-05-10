<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'      => ['required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,2})?$/'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'description' => ['required', 'string', 'max:255'],
            'date'        => ['required', 'date_format:Y-m-d'],
            'notes'       => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.gt'    => 'Amount must be greater than 0.',
            'amount.regex' => 'Amount can have at most 2 decimal places.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        $errors = collect($validator->errors()->messages())
            ->map(fn ($msgs, $field) => ['field' => $field, 'message' => $msgs[0]])
            ->values()
            ->all();

        throw new HttpResponseException(
            response()->error('Validation failed', $errors, 422)
        );
    }
}
