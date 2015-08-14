#!/usr/bin/ruby -w

radius = 35

(0..11).each do |n|
  h = n
  h = 12 if h == 0

  a = 2 * Math::PI * (h / 12.0);

  x = (Math.sin(a) * radius).round
  y = -(Math.cos(a) * radius).round

  puts "" if h % 3 == 0
  printf(%|   <text class="hour" id="%dh" x="%d" y="%d">%d</text>\n|,
         h, x, y, h)
end
