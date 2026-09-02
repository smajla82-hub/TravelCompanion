Travel Companion — Mobile UI Design Specification
1. Design direction

Overall style:

modern mobile travel application
clean, premium but practical
rounded cards
soft shadows
strong visual hierarchy
blue/purple primary branding
green for positive/active/recommended states
Light Mode + Dark Mode
responsive/mobile-first
typography: Inter
2. Color system
Light Mode
Token	Value	Použití
primary	#2563EB	hlavní CTA, aktivní prvky
primary-dark	#1E40AF	tmavší varianty primary
success	#10B981	Active Trip, Recommended, pozitivní stav
accent-purple	#8B5CF6	sekundární akce, ikony
accent-blue	#38BDF8	sekundární modré akcenty
text-primary	#0F172A	hlavní text
text-secondary	#64748B	sekundární text
background	#F8FAFC	hlavní pozadí
surface	#FFFFFF	karty
border	#E5E7EB	jemné okraje
Poznámka

V pùvodním obrázku je u barev dvakrát uvedeno Accent Purple a nìkolik hex hodnot je kvùli rozlišení mockupu špatnì èitelných. Výše jsem to normalizoval do jednoznaèného design token systému.

3. Dark Mode
Token	Value	Použití
primary	#60A5FA	hlavní CTA / primary
primary-dark	#3B82F6	tmavší primary
success	#10B981	Active Trip / pozitivní stav
accent-purple	#8B5CF6	sekundární akce
accent-blue	#38BDF8	modré akcenty
text-primary	#F8FAFC	hlavní text
text-secondary	#94A3B8	sekundární text
background	#0F172A	hlavní pozadí
surface	#18212F	karty
border	#334155	okraje

Dark Mode nemá být pouze invertovaná Light Mode. Karty musí zùstat vizuálnì oddìlené od pozadí.

4. Typography

Font:

Inter

H1
22px / 28px
font-weight: 700
H2
18px / 24px
font-weight: 600
H3
16px / 20px
font-weight: 600
Body
14px / 20px
font-weight: 400
Caption
12px / 16px
font-weight: 400
Button
14px / 16px
font-weight: 500
Doporuèení pro aplikaci
název tripu › H1/H2 podle kontextu
název sekce › H2
název aktivity › H3
detail aktivity › Body
pomocné informace › Caption
tlaèítka › Button
5. Cards
Card radius: 16px

Karty mají:

border-radius: 16px

Light Mode:

background: #FFFFFF
box-shadow:
0 4px 16px rgba(15, 23, 42, 0.08)

Dark Mode:

background: #18212F
box-shadow:
0 4px 16px rgba(0, 0, 0, 0.45)

Border mùže být použit zejména v Dark Mode pro lepší oddìlení:

border: 1px solid #334155
6. Buttons
Primary button

Použití:

New Trip
Continue Trip
Save
hlavní akce
height: 44–48px
border-radius: 12px
font-size: 14px
font-weight: 500

Light:

background: #2563EB
color: #FFFFFF

Dark:

background: #3B82F6
color: #FFFFFF
Secondary button

Použití:

My Trips
View whole itinerary
ménì dùležité akce

Light:

background: #FFFFFF
color: #0F172A
border: 1px solid #E5E7EB

Dark:

background: transparent
color: #F8FAFC
border: 1px solid #334155
Success / positive action
background: #10B981
color: #FFFFFF

Použití napøíklad:

Active Trip
Recommended
Completed
Confirmed
7. Icon system

Ikony nesmí být obrázky.

Použít SVG icon system, ideálnì napøíklad lucide-react.

Základní pravidla:

Style: Linear
Stroke width: 2px
Stroke linecap: round
Stroke linejoin: round
No filled icons except where explicitly required

Ikony mají být konzistentní napøíè celou aplikací.

Icon mapping
Navigation
Home
› Home

Settings
› Settings

My Trips
› BriefcaseBusiness / Luggage

New Trip
› Plus

View whole itinerary
› CalendarDays
Trip
Travellers
› UsersRound

Active Trip
› Circle / CheckCircle

Trip destination
› MapPin

Trip dates
› CalendarDays
Activity
Food / Restaurant
› Utensils

Parking
› SquareParking

Statistics
› ChartNoAxesColumnIncreasing

Location
› MapPin

Goal
› Target

Priority
› Zap

Flight
› Plane

Price
› DollarSign

Note
› NotebookPen

Next Activity
› ChevronRight
Action icons
Recommended
› Star

Expand
› ChevronDown

Collapse
› ChevronUp

More
› MoreHorizontal

Close
› X

Edit
› Pencil

Delete
› Trash2
8. Icon colors

Ikona nemusí být vždy stejná barva jako text.

Doporuèené mapování:

Primary:
#2563EB

Purple:
#8B5CF6

Success:
#10B981

Blue:
#38BDF8

Text:
#0F172A / #F8FAFC

Secondary:
#64748B / #94A3B8

Napøíklad:

Food       › Success / Green
Parking    › Purple
Statistics › Blue
Flight     › Accent Blue
Goal       › Success
Priority   › Primary
Price      › Success
9. Icon containers

Pokud je ikona umístìna v samostatném boxu:

border-radius: 12px

Napøíklad tlaèítko:

[ ? ]
Recommended

nebo

[ ?? ]
Parking

Box:

background: surface
border: 1px solid border
border-radius: 12px

Ikona:

24px
stroke-width: 2px
10. Current Activity

Tohle je podle mì dùležitá èást celého designu.

Current Activity má být vizuálnì dominantní èást dne.

Struktura:

CURRENT ACTIVITY

07:00    [Food icon]   Snídanì

?? Praha
?? Goal: Energie pøed cestou
? Priority: FOOD
?? Parking: P1
? Prague International Airport (PRG)
$ Price: 15–20 USD
?? Note: Lehèí snídanì pøed odletem

Vedle detailu mohou být akèní shortcuty:

-¦¦¦¦¦¦¦¦¦¦¦¦¦¦¬
-      ?      -
- Recommended  -
-     FOOD     -
L¦¦¦¦¦¦¦¦¦¦¦¦¦¦-

-¦¦¦¦¦¦¦¦¦¦¦¦¦¦¬
-      ??      -
-   Parking    -
L¦¦¦¦¦¦¦¦¦¦¦¦¦¦-

-¦¦¦¦¦¦¦¦¦¦¦¦¦¦¬
-      ??      -
-  Statistics  -
L¦¦¦¦¦¦¦¦¦¦¦¦¦¦-
11. Next Activity

Next Activity má být vizuálnì ménì dominantní než Current Activity.

NEXT ACTIVITY

09:35    [Plane]   Odlet z Prahy
                  Praha

              ...
           Show more

Current Activity = detail.

Next Activity = rychlý náhled.

12. Top background

Tady bych zachoval pøesnì to, na èem jsme se shodli:

modré/purple branded background, který se používá v horní èásti aplikace.

Obsah:

Travel Companion        ?

[ + New Trip ] [ My Trips ]

Current Trip

Background mùže mít velmi jemný dekorativní travel/mountain/city pattern.

Pattern:

velmi nízký opacity
nesmí konkurovat textu
pouze dekorace
žádný raster obrázek nutný pro samotný layout
13. Bottom navigation

Stejný branded background jako nahoøe.

-¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¬
-       ??          ?        -
-      Home       Settings    -
L¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦-

Ikony:

Home
Settings

Active:

white

Inactive:

white / reduced opacity

V Dark Mode zùstává bottom navigation tmavší modrofialová.

14. Spacing

Doporuèuji držet 8px spacing system:

4px   micro
8px   xs
12px  sm
16px  md
24px  lg
32px  xl

Typické použití:

Card padding: 16px
Section gap: 24px
Element gap: 8–12px
Button gap: 12px
Page horizontal padding: 16px
15. Responsive behaviour

Mobile-first.

Na telefonu:

1 column

Na širším displeji mùže být:

2 columns

ale Current Activity nesmí být kvùli gridu pøíliš stlaèená.

Priorita:

Current Trip
Itinerary
Current Activity
Next Activity
Secondary actions



SUMMARY

Implement the Travel Companion mobile UI using a modern premium travel-app design.

Use:
- React
- TypeScript
- mobile-first responsive layout
- Inter font
- Light Mode + Dark Mode
- SVG icons, preferably lucide-react
- linear icons
- 2px icon stroke
- round line caps and joins
- no raster images for icons

Design tokens:

Primary: #2563EB
Primary Dark: #1E40AF
Success: #10B981
Accent Purple: #8B5CF6
Accent Blue: #38BDF8

Light:
Background: #F8FAFC
Surface: #FFFFFF
Text Primary: #0F172A
Text Secondary: #64748B
Border: #E5E7EB

Dark:
Background: #0F172A
Surface: #18212F
Text Primary: #F8FAFC
Text Secondary: #94A3B8
Border: #334155

Typography:
H1 22/28 Bold
H2 18/24 Semibold
H3 16/20 Semibold
Body 14/20 Regular
Caption 12/16 Regular
Button 14/16 Medium

Cards:
radius 16px
padding 16px

Icon containers:
radius 12px
icon size approximately 24px
stroke width 2px

Light shadow:
0 4px 16px rgba(15, 23, 42, 0.08)

Dark shadow:
0 4px 16px rgba(0, 0, 0, 0.45)

Primary buttons:
44–48px height
12px radius

Use the blue/purple branded background for the top header and bottom navigation.

Current Activity must be the visual focal point of the itinerary.
Next Activity should be a compact preview.

Do not use the screenshot as a source of truth for text, data or layout dimensions.
Use the existing application's domain model and components.
The screenshot is only a visual design reference.