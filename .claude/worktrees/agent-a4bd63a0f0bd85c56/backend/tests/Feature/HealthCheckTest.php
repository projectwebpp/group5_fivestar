<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_returns_200(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
    }

    public function test_health_endpoint_returns_success_envelope(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertJson([
            'success' => true,
            'data'    => ['status' => 'ok'],
            'message' => 'API is healthy',
        ]);
    }
}
