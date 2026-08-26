# Records Data Documentation

This document describes the contents of [`records.json`](records.json). The data is organized as people, each with one or more historical record links and optional image annotation areas.

## Dataset Summary

| Metric | Count |
| --- | ---: |
| People (`records`) | 5 |
| Linked records (`links`) | 11 |
| Annotation areas (`areas`) | 11 |

## Data Model

```text
records[]
  id: number
  name: string
  links[]
    id: string
    title: string
    url: string
    notes: string
    areas[]
      id: string
      x: number | null
      y: number | null
      width: number | null
      height: number | null
      caption: string
      zoom: number
```

### Field Definitions

- `records[].id`: Numeric identifier for the person or family record group.
- `records[].name`: Display name for the person or family record group.
- `links[].id`: Identifier for an individual linked record, using the parent record ID as its prefix.
- `links[].title`: Display title for the linked source, image, or collage.
- `links[].url`: Relative path to the linked asset.
- `links[].notes`: Descriptive or historical notes for the linked record.
- `links[].areas`: Annotation regions associated with the linked asset.
- `areas[].id`: Identifier for an annotation area within a linked record.
- `areas[].x`, `areas[].y`: Horizontal and vertical position of the annotation area, expressed as percentages of the image dimensions. `null` means no position was supplied.
- `areas[].width`, `areas[].height`: Width and height of the annotation area, expressed as percentages of the image dimensions. `null` means no size was supplied.
- `areas[].caption`: Text displayed for the annotation area.
- `areas[].zoom`: Zoom value associated with the annotation area.

## Record Groups

### 1. Allen Bernard Falkman Sr

- **Record ID:** `1`
- **Linked records:** 5

#### 1a. 1920 Census - Allen B Falkman

- **Link ID:** `1a`
- **URL:** `../records/Census 1920 - Allen B Falkman Sr.jpg`
- **Notes:** This record is from the 1926 Census. The Falkman family, Herman, Mary, Bea and Allen are on lines 70 - 73. Mary's father, Gerald Allen, is on line 74.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=6.5`, `y=48`
- **Size:** `width=31`, `height=8.5`
- **Caption:** This record is from the 1920 Census. The Falkman family, Herman, Mary, Bea and Allen are on lines 70 - 73. Mary's father, Gerald Allen, is on line 74.
- **Zoom:** `90`

#### 1b. 1950 Census - Allen B Falkman

- **Link ID:** `1b`
- **URL:** `../records/Census 1950 - Allen B Falkman Sr.jpg`
- **Notes:** This record is from the 1950 Census. Notice that two of the boys, Gerald and Richard, were born in California, 'The Golden State'!
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=7`, `y=31.5`
- **Size:** `width=37`, `height=8`
- **Caption:** The Falkman family, Allen Sr (husband), Helen (wife) and their four boys, Allen Jr, Gerald, Richard and Robert, ages 5, 4, 3 and 2, are on lines 3 through 8.
- **Zoom:** `90`

#### 1c. Illinois Draft Registration - 1940

- **Link ID:** `1c`
- **URL:** `../records/Illinois Draft Registration 1940 - Allen B Falkman.jpg`
- **Notes:** This is the Illinois Draft Registration from 1940 for Allen B Falkman Sr.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=4`, `y=18`
- **Size:** `width=54`, `height=9`
- **Caption:** This is the Illinois Draft Registration from 1940 for Allen B Falkman Sr.
- **Zoom:** `90`

#### 1d. Allen Sr - Messanger Worlds Fair

- **Link ID:** `1d`
- **URL:** `../records/Allen Sr - Messanger Worlds Fair.BMP`
- **Notes:** This is a photo of Allen B Falkman Sr. at the 1933 Worlds Fair where he worked as a messenger. He was 15 years old. The 1933 World's Fair was the Century of Progress International Exposition in Chicago, Illinois, which celebrated the city's 100th anniversary with the theme "Science Finds, Industry Applies, Man Conforms". Held from May to October 1933 (and extended to 1934), it showcased advancements in science and technology, promoting a vision of a brighter future during the Great Depression, and featured many Art Deco-style buildings. Key attractions included the Firestone singing color fountains, a display of King Kong, and the first sale of Krispy Kreme donuts from an automated machine.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=null`, `y=null`
- **Size:** `width=null`, `height=null`
- **Caption:** At age 15, Allen was a messenger for the 1933 Worlds Fair in Chicago.
- **Zoom:** `90`

#### 1e. Allen Falkman Sr Collage

- **Link ID:** `1e`
- **URL:** `../records/Allen Falkman Sr Collage.svg`
- **Notes:** Here are several photos of Al Falkman Sr. He is a messenger at the 1933 Worlds Fair. Somehow, he persuaded my grandmother (Mary) to chauffer him around while he was in the Army. One pic with an early admirer and a shoeshine while playing solider in Europe.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=null`, `y=null`
- **Size:** `width=null`, `height=null`
- **Caption:** At age 15, Allen was a messenger for the 1933 Worlds Fair in Chicago.
- **Zoom:** `90`

### 2. Helen Katherine Alexander

- **Record ID:** `2`
- **Linked records:** 2

#### 2a. New Jersey Census 1930

- **Link ID:** `2a`
- **URL:** `../records/New Jersey Census 1930 - Helen K Alexander.jpg`
- **Notes:** This document is from the 1930 Census. Although difficult to see, the Alexander family, Frank Sr, Ida, Frank Jr, Violet and Helen are on lines 42 through 46. Violet is listed as Walley. I understand that they called her Walley because she was a wall-flower. Use the magnifier to get a better look.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=4`, `y=80`
- **Size:** `width=22`, `height=9`
- **Caption:** The Alexander Family - 1930 Census. Frank Sr, Ida, Frank Jr, Violet and Helen (my mother).
- **Zoom:** `90`

#### 2b. 1950 Census - Helen K Falkman

- **Link ID:** `2b`
- **URL:** `../records/Census 1950 - Allen B Falkman Sr.jpg`
- **Notes:** This record is from the 1950 Census. The Falkman family, Allen Sr, Helen K (née Alexander), Allen Jr, Gerald, Richard and Robert are on lines 3 through 8.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=7`, `y=32`
- **Size:** `width=44`, `height=8`
- **Caption:** The Falkman Family in 1950.
- **Zoom:** `90`

### 3. Nils Peter Falkman

- **Record ID:** `3`
- **Linked records:** 1

#### 3a. 1910 Census - Nils Falkman and Family

- **Link ID:** `3a`
- **URL:** `../records/1910 Census - Nils Falkman.jpg`
- **Notes:** This is from the 1910 census in Illinois. It contain the Falkman family, Nils Peter, Katherine, Herman, Lillian, Ester and Theodore on lines 51 through 56.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=6`, `y=19`
- **Size:** `width=27`, `height=10`
- **Caption:** Nils P Falkman Family in 1910.
- **Zoom:** `90`

### 4. Herman Ralph Falkman

- **Record ID:** `4`
- **Linked records:** 2

#### 4a. 1940 Cook County Census - Herman Falkman and Family

- **Link ID:** `4a`
- **URL:** `../records/Cook County Census 1940 - Herman Falkman.jpg`
- **Notes:** This image is from the 1940 census in Cook County Illinois. It contain the Herman Falkman family, Herman, wife Mary and son Allen on lines 6 through 8.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=8`, `y=28`
- **Size:** `width=27`, `height=5`
- **Caption:** 1940 census -- It contain the Herman Falkman Family, Herman, wife Mary and son Allen
- **Zoom:** `90`

#### 4b. 1920 Census - Herman R Falkman

- **Link ID:** `4b`
- **URL:** `../records/Census 1920 - Allen B Falkman Sr.jpg`
- **Notes:** This record is from the 1920 Census. The Falkman family, Herman, Mary, Bea and Allen are on lines 90 - 73. Mary's father, Gerald Allen is on line 74.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=7`, `y=48`
- **Size:** `width=32`, `height=8`
- **Caption:** At age 15, Allen was a messenger for the 1933 Worlds Fair in Chicago.
- **Zoom:** `90`

### 5. Karen Norén

- **Record ID:** `5`
- **Linked records:** 1

#### 5a. Delsbo Parish Family Census 1883-1892 - Karin Norén

- **Link ID:** `5a`
- **URL:** `../records/Delsbo Parish Family Census 1883–1892  Karin Norén.jpg`
- **Notes:** This is a page from the Delsbo Parish Family Census 1883-1892. Karin Norén Left Sweden in May of 1892 so this is the last Delsbo Parish Family Census that Karin's name appears in.
- **Areas:** 1

##### Area 1

- **Area ID:** `area1`
- **Position:** `x=9`, `y=85.6`
- **Size:** `width=40`, `height=4`
- **Caption:** This records shows that Karin Norén was born on the 12th day of the 12 month in the year 1867.
- **Zoom:** `90`

## Link Inventory

| Link ID | Parent ID | Title | Asset |
| --- | ---: | --- | --- |
| `1a` | 1 | 1920 Census - Allen B Falkman | `Census 1920 - Allen B Falkman Sr.jpg` |
| `1b` | 1 | 1950 Census - Allen B Falkman | `Census 1950 - Allen B Falkman Sr.jpg` |
| `1c` | 1 | Illinois Draft Registration - 1940 | `Illinois Draft Registration 1940 - Allen B Falkman.jpg` |
| `1d` | 1 | Allen Sr - Messanger Worlds Fair | `Allen Sr - Messanger Worlds Fair.BMP` |
| `1e` | 1 | Allen Falkman Sr Collage | `Allen Falkman Sr Collage.svg` |
| `2a` | 2 | New Jersey Census 1930 | `New Jersey Census 1930 - Helen K Alexander.jpg` |
| `2b` | 2 | 1950 Census - Helen K Falkman | `Census 1950 - Allen B Falkman Sr.jpg` |
| `3a` | 3 | 1910 Census - Nils Falkman and Family | `1910 Census - Nils Falkman.jpg` |
| `4a` | 4 | 1940 Cook County Census - Herman Falkman and Family | `Cook County Census 1940 - Herman Falkman.jpg` |
| `4b` | 4 | 1920 Census - Herman R Falkman | `Census 1920 - Allen B Falkman Sr.jpg` |
| `5a` | 5 | Delsbo Parish Family Census 1883-1892 - Karin Norén | `Delsbo Parish Family Census 1883–1892  Karin Norén.jpg` |

## Data Notes

- Every linked record currently contains exactly one area with ID `area1` and zoom `90`.
- Links `1d`, `1e` have `null` values for all area position and size fields.
- The JSON is documented as stored, including spelling, punctuation, duplicate asset paths, and differing historical descriptions.
- The name in record `5` is `Karen Norén`, while the linked title and notes refer to `Karin Norén`.
