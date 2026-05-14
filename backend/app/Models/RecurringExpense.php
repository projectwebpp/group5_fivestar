<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringExpense extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'description',
        'amount',
        'currency',
        'frequency',
        'start_date',
        'last_created_date',
    ];

    protected $casts = [
        'amount'            => 'decimal:2',
        'start_date'        => 'date:Y-m-d',
        'last_created_date' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
