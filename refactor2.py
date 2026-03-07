with open("src/finance/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Extracts based on strict line indices
donut = lines[545:627]
donut[1] = donut[1].replace('className="lg:col-span-2 space-y-8"', 'className="w-full space-y-8"')

budget_health = lines[628:689]
budget_health[1] = budget_health[1].replace('className="lg:col-span-1 space-y-6"', 'className="w-full space-y-6"')

loans_jars = lines[691:810]
loans_jars[1] = loans_jars[1].replace('lg:grid-cols-2', 'md:grid-cols-2')

smart_insights = lines[811:1028]
smart_insights[1] = smart_insights[1].replace('lg:grid-cols-3', 'md:grid-cols-2')

sidebar_rest = lines[1032:1239]

new_layout = [
    '      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">\n',
    '        {/* LEFT COLUMN (2/3 width) */}\n',
    '        <div className="lg:col-span-2 space-y-8 flex flex-col">\n',
] + donut + ['\n'] + loans_jars + ['\n'] + smart_insights + [
    '        </div>\n',
    '\n',
    '        {/* RIGHT SIDEBAR (1/3 width) */}\n',
    '        <div className="lg:col-span-1 space-y-8 flex flex-col">\n'
] + budget_health + ['\n'] + sidebar_rest + [
    '        </div>\n',
    '      </div>\n'
]

final_lines = lines[:544] + new_layout + lines[1240:]

with open("src/finance/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.writelines(final_lines)

print("Line-based rewrite complete!")
