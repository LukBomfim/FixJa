from dataclasses import dataclass
from typing import Callable, TypeVar

T = TypeVar("T")
K = TypeVar("K")


@dataclass
class SortMetrics:
    comparisons: int = 0
    swaps: int = 0
    moves: int = 0


def _key_function(key: Callable[[T], K] | None) -> Callable[[T], object]:
    return key if key is not None else lambda item: item


def bubble_sort(values: list[T], key: Callable[[T], K] | None = None) -> tuple[list[T], SortMetrics]:
    result = list(values)
    get_key = _key_function(key)
    metrics = SortMetrics()
    for end in range(len(result) - 1, 0, -1):
        swapped = False
        for index in range(end):
            metrics.comparisons += 1
            if get_key(result[index]) > get_key(result[index + 1]):
                result[index], result[index + 1] = result[index + 1], result[index]
                metrics.swaps += 1
                swapped = True
        if not swapped:
            break
    return result, metrics


def insertion_sort(values: list[T], key: Callable[[T], K] | None = None) -> tuple[list[T], SortMetrics]:
    result = list(values)
    get_key = _key_function(key)
    metrics = SortMetrics()
    for index in range(1, len(result)):
        item = result[index]
        item_key = get_key(item)
        position = index
        while position > 0:
            metrics.comparisons += 1
            if get_key(result[position - 1]) <= item_key:
                break
            result[position] = result[position - 1]
            metrics.moves += 1
            position -= 1
        if position != index:
            result[position] = item
            metrics.moves += 1
    return result, metrics


def selection_sort(values: list[T], key: Callable[[T], K] | None = None) -> tuple[list[T], SortMetrics]:
    result = list(values)
    get_key = _key_function(key)
    metrics = SortMetrics()
    for start in range(len(result) - 1):
        smallest = start
        for index in range(start + 1, len(result)):
            metrics.comparisons += 1
            if get_key(result[index]) < get_key(result[smallest]):
                smallest = index
        if smallest != start:
            result[start], result[smallest] = result[smallest], result[start]
            metrics.swaps += 1
    return result, metrics


def quick_sort(values: list[T], key: Callable[[T], K] | None = None) -> tuple[list[T], SortMetrics]:
    result = list(values)
    get_key = _key_function(key)
    metrics = SortMetrics()
    ranges = [(0, len(result) - 1)] if len(result) > 1 else []

    while ranges:
        low, high = ranges.pop()
        pivot = get_key(result[(low + high) // 2])
        left, right = low, high

        while left <= right:
            while left <= high:
                metrics.comparisons += 1
                if get_key(result[left]) >= pivot:
                    break
                left += 1
            while right >= low:
                metrics.comparisons += 1
                if get_key(result[right]) <= pivot:
                    break
                right -= 1
            if left <= right:
                if left != right:
                    result[left], result[right] = result[right], result[left]
                    metrics.swaps += 1
                left += 1
                right -= 1

        if low < right:
            ranges.append((low, right))
        if left < high:
            ranges.append((left, high))

    return result, metrics
