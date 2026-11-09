import base64
import os
import random
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://unit-test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "unit-test-key")

from app import app
from algoritmos.grafo_geografico import (
    construir_grafo,
    coordenadas_validas,
    dijkstra,
    distancia_haversine,
    reconstruir_caminho,
)
from algoritmos.ordenacao import bubble_sort, insertion_sort, quick_sort, selection_sort
from servicos.benchmark_service import comparar_ordenacoes
from servicos.geografia_service import recomendar_prestadores
from servicos.visualizacao_service import gerar_grafico_benchmark, gerar_grafico_geografico


class SortingAlgorithmTests(unittest.TestCase):
    def test_all_algorithms_return_equivalent_order_and_metrics(self):
        records = [
            {"id": "p3", "rating": 4.0},
            {"id": "p1", "rating": 5.0},
            {"id": "p2", "rating": 4.0},
            {"id": "p4", "rating": 2.0},
        ]
        key = lambda item: (-item["rating"], item["id"])
        expected = sorted(records, key=key)

        for algorithm in (bubble_sort, insertion_sort, selection_sort, quick_sort):
            with self.subTest(algorithm=algorithm.__name__):
                result, metrics = algorithm(records, key=key)
                self.assertEqual(result, expected)
                self.assertGreater(metrics.comparisons, 0)
                self.assertEqual(records[0]["id"], "p3")

    def test_algorithms_handle_empty_and_single_item_inputs(self):
        for algorithm in (bubble_sort, insertion_sort, selection_sort, quick_sort):
            self.assertEqual(algorithm([])[0], [])
            self.assertEqual(algorithm([7])[0], [7])

    def test_algorithms_sort_varied_duplicate_and_reversed_inputs(self):
        generator = random.Random(42)
        inputs = [list(range(30, -1, -1)), [4] * 20]
        inputs.extend(
            [generator.randrange(-10, 11) for _ in range(size)]
            for size in range(31)
        )
        for values in inputs:
            for algorithm in (bubble_sort, insertion_sort, selection_sort, quick_sort):
                with self.subTest(algorithm=algorithm.__name__, size=len(values)):
                    self.assertEqual(algorithm(values)[0], sorted(values))


class GeographicGraphTests(unittest.TestCase):
    def test_haversine_calculates_earth_distance_and_validates_coordinates(self):
        distance = distancia_haversine(0, 0, 0, 1)
        self.assertAlmostEqual(distance, 111.195, delta=0.1)
        self.assertTrue(coordenadas_validas(-23.5, -46.6))
        self.assertFalse(coordenadas_validas(float("nan"), 0))
        self.assertFalse(coordenadas_validas(True, 0))
        self.assertFalse(coordenadas_validas(91, 0))

    def test_knn_graph_is_connected_and_dijkstra_reconstructs_path(self):
        vertices = [
            {"id": "origin", "latitude": 0.0, "longitude": 0.0},
            {"id": "a", "latitude": 0.0, "longitude": 1.0},
            {"id": "b", "latitude": 0.0, "longitude": 2.0},
            {"id": "c", "latitude": 0.0, "longitude": 3.0},
        ]
        graph = construir_grafo(vertices, vizinhos=1)
        distances, previous = dijkstra(graph, "origin")

        self.assertEqual(sum(len(edges) for edges in graph.values()) // 2, 3)
        self.assertAlmostEqual(distances["c"], distancia_haversine(0, 0, 0, 3), delta=0.01)
        self.assertEqual(reconstruir_caminho(previous, "c"), ["origin", "a", "b", "c"])

    @patch("servicos.geografia_service.gerar_grafico_geografico", return_value=b"png")
    @patch("servicos.geografia_service.buscar_prestadores_com_coordenadas")
    def test_recommendations_use_graph_distances_and_real_provider_records(self, find_providers, render):
        find_providers.return_value = [
            {"id": "far", "username": "Mais distante", "latitude": 0.0, "longitude": 2.0},
            {"id": "near", "username": "Mais perto", "latitude": 0.0, "longitude": 1.0},
        ]

        result = recomendar_prestadores(0, 0)

        self.assertEqual([item["prestador"]["id"] for item in result["prestadores"]], ["near", "far"])
        self.assertAlmostEqual(result["prestadores"][0]["distancia_km"], 111.2, delta=0.1)
        self.assertEqual(result["quantidade_vertices"], 3)
        self.assertEqual(result["quantidade_arestas"], 3)
        render.assert_called_once()


class BenchmarkTests(unittest.TestCase):
    @patch("servicos.benchmark_service.gerar_grafico_benchmark", return_value=b"png")
    def test_benchmark_measures_real_records_at_multiple_sizes(self, render):
        providers = [
            {"id": f"provider-{index}", "username": f"Provider {index}", "avaliacao": rating}
            for index, rating in enumerate((3.0, 5.0, 4.0, 4.5))
        ]

        result = comparar_ordenacoes(providers)

        self.assertEqual(result["registros_disponiveis"], 4)
        self.assertEqual([scenario["quantidade"] for scenario in result["cenarios"]], [1, 2, 4])
        for scenario in result["cenarios"]:
            self.assertEqual(len(scenario["resultados"]), 4)
            self.assertIn(scenario["mais_rapido"], {item["algoritmo"] for item in scenario["resultados"]})
        self.assertEqual(base64.b64decode(result["grafico_png_base64"]), b"png")
        render.assert_called_once()

    def test_matplotlib_renders_real_pngs_for_both_views(self):
        scenarios = [{
            "quantidade": 2,
            "resultados": [
                {"algoritmo": name, "tempo_ms": index + 0.1}
                for index, name in enumerate(("Bubble Sort", "Insertion Sort", "Selection Sort", "QuickSort"))
            ],
        }]
        vertices = [
            {"id": "origin", "latitude": 0.0, "longitude": 0.0},
            {"id": "provider", "latitude": 0.0, "longitude": 1.0},
        ]
        graph = construir_grafo(vertices, vizinhos=1)

        self.assertTrue(gerar_grafico_benchmark(scenarios).startswith(b"\x89PNG"))
        self.assertTrue(gerar_grafico_geografico(vertices, graph, ["origin", "provider"]).startswith(b"\x89PNG"))


class GeographicRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    @patch("rotas.geografia_routes.recomendar_prestadores")
    @patch("rotas.geografia_routes.buscar_perfil_por_id")
    @patch("auth.middleware.create_client")
    @patch("auth.middleware.supabase_client.auth.get_user")
    def test_nearby_endpoint_validates_location_and_client_role(
        self, get_user, create_client, get_profile, recommend
    ):
        get_user.return_value = SimpleNamespace(user=SimpleNamespace(id="client-id"))
        create_client.return_value.postgrest.auth = lambda _token: None
        get_profile.return_value = {"tipo": "CLIENTE"}

        invalid = self.client.post(
            "/prestadores/proximos",
            headers={"Authorization": "Bearer test-token"},
            json={"latitude": 120, "longitude": -46},
        )
        self.assertEqual(invalid.status_code, 400)
        recommend.assert_not_called()

        get_profile.return_value = {"tipo": "PRESTADOR"}
        forbidden = self.client.post(
            "/prestadores/proximos",
            headers={"Authorization": "Bearer test-token"},
            json={"latitude": -23.5, "longitude": -46.6},
        )
        self.assertEqual(forbidden.status_code, 403)
        recommend.assert_not_called()

    def test_new_endpoints_require_authentication(self):
        self.assertEqual(self.client.post("/prestadores/proximos", json={}).status_code, 401)
        self.assertEqual(self.client.get("/analises/benchmark").status_code, 401)


if __name__ == "__main__":
    unittest.main()
