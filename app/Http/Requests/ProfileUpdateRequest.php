<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'age' => ['nullable', 'integer', 'min:18', 'max:100'],
            'gender' => ['nullable', 'in:male,female,other'],
            'religion' => ['nullable', 'in:sunni_nazar_niyaz,sunni_no_nazar_niyaz,shia,christian'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['required', 'integer', 'exists:languages,id'],
        ];
    }
}
