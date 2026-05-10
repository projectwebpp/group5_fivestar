<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::where('user_id', auth()->id())
            ->orderBy('name')
            ->get();

        return response()->success($categories, 'Categories retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => [
                'required',
                'string',
                'max:50',
                Rule::unique('categories')->where('user_id', auth()->id()),
            ],
            'icon'  => 'required|string|max:50',
            'color' => 'required|string|size:7',
        ]);

        $category = Category::create(array_merge($data, ['user_id' => auth()->id()]));

        return response()->success($category, 'Category created', 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->error('Not found', [], 404);
        }

        $data = $request->validate([
            'name'  => [
                'required',
                'string',
                'max:50',
                Rule::unique('categories')->where('user_id', auth()->id())->ignore($category->id),
            ],
            'icon'  => 'required|string|max:50',
            'color' => 'required|string|size:7',
        ]);

        $category->update($data);

        return response()->success($category->fresh(), 'Category updated');
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->error('Not found', [], 404);
        }

        // Deletion guard — expenses.user_id does NOT exist yet (added in Phase 4).
        // Ownership is already enforced above, so this guard is correctly scoped.
        if (Expense::where('category_id', $category->id)->exists()) {
            return response()->error('Category has expenses and cannot be deleted', [], 422);
        }

        $category->delete();

        return response()->success(null, 'Category deleted');
    }
}
