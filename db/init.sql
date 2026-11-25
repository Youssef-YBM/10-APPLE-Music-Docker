CREATE TABLE songs (
    id     SERIAL PRIMARY KEY,
    title  TEXT    NOT NULL,
    artist TEXT    NOT NULL,
    year   INTEGER NOT NULL
);

INSERT INTO songs (title, artist, year) VALUES
    ('Bohemian Rhapsody',       'Queen',          1975),
    ('Imagine',                 'John Lennon',    1971),
    ('Billie Jean',             'Michael Jackson', 1982),
    ('Hotel California',        'Eagles',         1976),
    ('Smells Like Teen Spirit', 'Nirvana',        1991),
    ('Hey Jude',                'The Beatles',    1968),
    ('Rolling in the Deep',     'Adele',          2010),
    ('Shape of You',            'Ed Sheeran',     2017),
    ('Blinding Lights',         'The Weeknd',     2019),
    ('Lose Yourself',           'Eminem',         2002),
    ('Wonderwall',              'Oasis',          1995),
    ('Aicha',                   'Khaled',         1996);
