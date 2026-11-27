/* =========================================================
   Achievement page content
   ---------------------------------------------------------
   Edit this file to change headings and award lists. Photos
   themselves live in achievements-images/ and are picked up
   by the build script.

   Awards are grouped the way the certificate board reads:
   Academic, Competition, Leadership, Extracurricular.

   After adding photos:  npm run achievements
   ========================================================= */

window.ACHIEVEMENT_CONTENT = {
	start: {
		school: 'KAJ Play and Learn Center',
		level: 'Daycare & kindergarten',
		years: '2012-2014',
		logo: 'kaj',
		logoText: 'KAJ',
		photo: 'profiles/KINDERGARTEN VERNON.jpg',
		bg: 'image/kinderschool.jpg',
		tag: 'Photo',
		groups: [
			{
				label: 'Academic',
				icon: 'academic',
				items: [
					'Graduated — Top 3'
				]
			}
		]
	},
	schools: [
		{
			id: 'elementary',
			stage: 'Elementary',
			school: 'Bolinao Christian School',
			years: '2014–2020',
			logo: 'bcs',
			folder: 'ELEM',
			bg: 'achievements-images/bg/bcs-bg.jpg',
			photo: 'profiles/thumbs/elem-vernon.jpg',
			tag: 'Diploma',
			groups: [
				{
					label: 'Academic',
					icon: 'academic',
					items: [
						'Consistent Honor Student'
					]
				},
				{
					label: 'Competition',
					icon: 'competition',
					items: [
						'1st place Nutrition Month Poster Making Contest (2017)',
						'Division Science Contest, 4th place Spelling Bee (2018)'
					]
				}
			],
			emptyLabel: 'Certificates coming soon'
		},
		{
			id: 'junior-high',
			stage: 'Junior High School',
			school: 'Bolinao Integrated School',
			years: '2020–2024',
			logo: 'bis',
			folder: 'JHS',
			bg: 'achievements-images/bg/bis-bg.jpg',
			photo: 'profiles/thumbs/jhs-vernon-2.jpg',
			tag: 'Diploma',
			groups: [
				{
					label: 'Academic',
					icon: 'academic',
					items: [
						'With Honors — Grade 9',
						'With High Honors — Grade 10',
						'Outstanding Performance in Arts'
					]
				},
				{
					label: 'Competition',
					icon: 'competition',
					items: [
						'JS Prom, Star of the Night',
						'Mr. Intramurals, 1st Runner-Up (2023–2024)',
						"Mr. Intramurals, People's Choice (2023–2024)",
						'Career Guidance, Best Dressed Young Career Person (2023)',
						'Project Runway — 1st Place'
					]
				}
			],
			emptyLabel: 'Certificates coming soon'
		},
		{
			id: 'senior-high',
			stage: 'Senior High School',
			school: 'Bolinao Integrated School',
			years: '2024–2026',
			logo: 'bis',
			folder: 'SHS',
			bg: 'achievements-images/bg/bis-bg.jpg',
			photo: 'profiles/thumbs/shs-vernon.jpg',
			grad: 'SHS/17-katibayan-diploma.jpg',
			tag: 'Diploma',
			groups: [
				{
					label: 'Academic',
					icon: 'academic',
					items: [
						'With High Honors — Grade 11',
						'With Highest Honors — Grade 12',
						'Graduation — Rank 2'
					]
				},
				{
					label: 'Competition',
					icon: 'competition',
					items: [
						'Outstanding Performance in Quantitative Research',
						'Outstanding Performance in Communication Arts',
						'Outstanding Performance in Performing Arts',
						'Zumba King — 2025',
						'Lakandula ng Wika — 2024',
						'Mr. SDO 1 Athletic Association Meet Pangasinan — 2025',
						'Mr. SDO 1 ABM Ambassador — 2025'
					]
				},
				{
					label: 'Leadership',
					icon: 'leadership',
					items: [
						'Outstanding Performance in a Club/Organization (Journalism)'
					]
				}
			],
			emptyLabel: 'Certificates coming soon'
		},
		{
			id: 'college',
			stage: 'College',
			school: 'University of the Cordilleras',
			logo: 'uc',
			folder: 'COLLEGE',
			bg: 'achievements-images/bg/uc-bg.jpg',
			status: '2026 -',
			statusNote: 'Ongoing',
			tag: 'Campus',
			groups: [
				{
					label: 'Academic',
					icon: 'academic',
					items: [
						'Bagong Pilipinas Merit Scholarship Awardee'
					]
				}
			],
			emptyLabel: 'Scholar photo coming soon'
		}
	]
};
