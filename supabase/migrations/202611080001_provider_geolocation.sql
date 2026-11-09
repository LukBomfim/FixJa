alter table public.profiles
  add column if not exists estado text,
  add column if not exists endereco text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_valid_geolocation'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_valid_geolocation
      check (
        (
          (latitude is null and longitude is null)
          or (
            latitude is not null
            and longitude is not null
            and latitude between -90 and 90
            and longitude between -180 and 180
          )
        )
        and (
        estado is null
        or estado in (
          'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
          'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
          'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        )
        )
      );
  end if;
end
$$;

create index if not exists profiles_provider_geolocation_idx
  on public.profiles (tipo, latitude, longitude)
  where tipo = 'PRESTADOR' and latitude is not null and longitude is not null;
