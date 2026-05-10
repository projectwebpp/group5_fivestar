<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['user_id', 'name', 'icon', 'color'];

    // budget is v2; description omitted from v1 API
    protected $hidden = ['budget', 'description'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
