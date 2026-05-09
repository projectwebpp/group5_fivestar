<?php

namespace Tests\Unit;

use Tests\TestCase;

class JwtConfigTest extends TestCase
{
    public function test_jwt_ttl_is_integer(): void
    {
        $ttl = config('jwt.ttl');
        $this->assertIsInt($ttl, 'JWT TTL must be int — PHP 8.2 throws TypeError if string');
    }

    public function test_jwt_refresh_ttl_is_integer(): void
    {
        $refreshTtl = config('jwt.refresh_ttl');
        $this->assertIsInt($refreshTtl, 'JWT refresh_ttl must be int — PHP 8.2 throws TypeError if string');
    }

    public function test_api_guard_uses_jwt_driver(): void
    {
        $driver = config('auth.guards.api.driver');
        $this->assertSame('jwt', $driver, 'api guard must use jwt driver, not session or sanctum');
    }
}
