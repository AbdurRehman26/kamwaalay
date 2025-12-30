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
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'age' => ['nullable', 'integer', 'min:18', 'max:100'],
            'gender' => ['nullable', 'in:male,female,other'],
            'religion' => ['nullable', 'in:' . Religion::validationString()],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['required', 'integer', 'exists:languages,id'],
            'pin_address' => ['nullable', 'string', 'max:500'],
            'pin_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'pin_longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
