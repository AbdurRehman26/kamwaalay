<?php

namespace App\Http\Requests;

use App\Enums\Religion;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'age' => ['nullable', 'integer', 'min:18', 'max:100'],
            'gender' => ['nullable', 'in:male,female,other'],
            'religion' => ['nullable', 'in:' . Religion::validationString()],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['required', 'integer', 'exists:languages,id'],
        ];
    }
}
